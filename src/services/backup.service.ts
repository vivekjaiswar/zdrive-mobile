import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import filesService from './files.service';
import foldersService from './folders.service';

// ---------------------------------------------------------------------------
// Photo Backup engine (Phase 1 - mobile only, no backend changes)
//
// Enumerates the device's photo library via expo-media-library and uploads
// anything not already backed up through the EXISTING /storage/upload
// endpoint. Progress and on/off state live in store/backup.store.ts; this
// file is the actual work: permission, enumeration, the local ledger, and
// the upload loop.
//
// Deliberate Phase-1 limits (documented so nobody mistakes them for bugs):
//  - IMAGES ONLY. Videos are excluded until the backend supports resumable
//    upload - the current single-shot in-memory upload can't handle large
//    video files reliably.
//  - FOREGROUND ONLY. Runs while the app is open; there's no background
//    task yet (Phase 3).
//  - NO SERVER DEDUP. The backend has no (userId, contentHash) uniqueness
//    check yet, so this relies on a LOCAL ledger to avoid re-uploading.
//    That means a fresh install (empty ledger) will re-upload everything
//    and create duplicates server-side. Phase 2 (dedup endpoint) fixes it.
// ---------------------------------------------------------------------------

const LEDGER_FILENAME = 'photo-backup-ledger.json';
const BACKUP_FOLDER_NAME = 'Phone Photos';
const PAGE_SIZE = 50;
// Persist the ledger every N successful uploads so a mid-run crash/kill
// doesn't lose all progress (worst case we re-check, not re-upload, since
// the server file already exists - but without dedup that still costs a
// duplicate, so we keep the window small).
const LEDGER_FLUSH_EVERY = 15;

// assetId -> true. A set of every MediaLibrary asset we've confirmed
// uploaded on THIS device/install.
type Ledger = Record<string, true>;

export type BackupRunResult =
  | 'complete'
  | 'cancelled'
  | 'busy'
  | 'no-permission'
  | 'subscription-expired'
  | 'error';

export interface BackupProgress {
  done: number;
  total: number;
}

// Same substring match used by useFileUpload - the backend blocks uploads
// once a subscription lapses, and every remaining file would fail the same
// way, so we stop the whole run rather than hammering the API.
function isSubscriptionExpiredError(error: any): boolean {
  const message: string = error?.response?.data?.message ?? '';
  return message.toLowerCase().includes('subscription has expired');
}

function mimeFromFilename(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg';
  }
}

class BackupService {
  private ledger: Ledger | null = null;
  private running = false;
  private cancelFlag = false;
  // Cached per session so we don't re-list folders on every run.
  private backupFolderId: string | null = null;

  get isRunning(): boolean {
    return this.running;
  }

  // Asks for the media-library permission. THIS is the call that shows the
  // real OS dialog on Android 13+/iOS. Returns true for full OR limited
  // access (the caller decides how to message "limited").
  async requestPermission(): Promise<MediaLibrary.PermissionResponse> {
    return MediaLibrary.requestPermissionsAsync();
  }

  async getPermission(): Promise<MediaLibrary.PermissionResponse> {
    return MediaLibrary.getPermissionsAsync();
  }

  requestCancel() {
    this.cancelFlag = true;
  }

  // ---- ledger --------------------------------------------------------------

  private ledgerFile(): File {
    return new File(Paths.document, LEDGER_FILENAME);
  }

  private async loadLedger(): Promise<Ledger> {
    if (this.ledger) return this.ledger;
    try {
      const f = this.ledgerFile();
      if (f.exists) {
        this.ledger = JSON.parse(await f.text()) as Ledger;
      } else {
        this.ledger = {};
      }
    } catch {
      // Corrupt/unreadable ledger - start fresh rather than crash. Worst
      // case is re-checking already-uploaded assets.
      this.ledger = {};
    }
    return this.ledger;
  }

  private saveLedger() {
    if (!this.ledger) return;
    try {
      const f = this.ledgerFile();
      if (!f.exists) f.create();
      f.write(JSON.stringify(this.ledger));
    } catch {
      // Non-fatal: we just lose crash-resistance for this window.
    }
  }

  // How many photos have been backed up (used to show a count without a
  // full run). Loads the ledger lazily.
  async backedUpCount(): Promise<number> {
    const ledger = await this.loadLedger();
    return Object.keys(ledger).length;
  }

  // ---- backup folder -------------------------------------------------------

  // Keeps auto-backed-up photos out of the user's root drive. Finds an
  // existing "Phone Photos" root folder or creates one. Best-effort: if
  // folder ops fail, we fall back to uploading to root (folderId undefined)
  // rather than aborting the whole backup.
  private async getBackupFolderId(): Promise<string | undefined> {
    if (this.backupFolderId) return this.backupFolderId;
    try {
      const folders = await foldersService.list();
      const existing = folders.find((f) => f.name === BACKUP_FOLDER_NAME);
      if (existing) {
        this.backupFolderId = existing.id;
        return existing.id;
      }
      const created = await foldersService.create(BACKUP_FOLDER_NAME);
      this.backupFolderId = created.id;
      return created.id;
    } catch {
      return undefined;
    }
  }

  // ---- the run loop --------------------------------------------------------

  async run(onProgress: (p: BackupProgress) => void): Promise<BackupRunResult> {
    if (this.running) return 'busy';

    // Don't prompt here - enabling in Settings already did. Just verify.
    const perm = await this.getPermission();
    if (!perm.granted) return 'no-permission';

    this.running = true;
    this.cancelFlag = false;

    try {
      const ledger = await this.loadLedger();
      const folderId = await this.getBackupFolderId();

      // Total = every image in the library. Denominator for the progress
      // bar; `done` counts both skips (already in ledger) and new uploads
      // so it climbs to `total` even on an all-skipped re-run.
      const firstProbe = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo],
        first: 1,
      });
      const total = firstProbe.totalCount;
      let done = 0;
      let sinceFlush = 0;
      onProgress({ done, total });

      let after: MediaLibrary.AssetRef | undefined;
      let hasNextPage = true;

      while (hasNextPage) {
        if (this.cancelFlag) {
          this.saveLedger();
          return 'cancelled';
        }

        const page = await MediaLibrary.getAssetsAsync({
          mediaType: [MediaLibrary.MediaType.photo],
          first: PAGE_SIZE,
          after,
          sortBy: [MediaLibrary.SortBy.creationTime],
        });

        for (const asset of page.assets) {
          if (this.cancelFlag) {
            this.saveLedger();
            return 'cancelled';
          }

          if (ledger[asset.id]) {
            done += 1;
            onProgress({ done, total });
            continue;
          }

          try {
            // asset.uri can be a content://media/... URI that FormData
            // can't always read; getAssetInfoAsync resolves a concrete
            // localUri we can hand to the uploader.
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            const uri = info.localUri ?? asset.uri;

            await filesService.upload(
              uri,
              asset.filename,
              mimeFromFilename(asset.filename),
              folderId,
            );

            ledger[asset.id] = true;
            done += 1;
            sinceFlush += 1;
            if (sinceFlush >= LEDGER_FLUSH_EVERY) {
              this.saveLedger();
              sinceFlush = 0;
            }
            onProgress({ done, total });
          } catch (error: any) {
            if (isSubscriptionExpiredError(error)) {
              this.saveLedger();
              return 'subscription-expired';
            }
            // Skip this one asset (don't mark it done) and keep going -
            // a single bad/unsupported file shouldn't stall the backup.
          }
        }

        hasNextPage = page.hasNextPage;
        after = page.endCursor;
      }

      this.saveLedger();
      return 'complete';
    } catch {
      this.saveLedger();
      return 'error';
    } finally {
      this.running = false;
    }
  }
}

export default new BackupService();
