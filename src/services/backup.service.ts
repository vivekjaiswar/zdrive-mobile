import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import filesService from './files.service';
import foldersService from './folders.service';

// Safe dynamic imports for optional native modules in Expo dev client
let MediaLibrary: typeof import('expo-media-library') | null = null;
let TaskManager: typeof import('expo-task-manager') | null = null;
let BackgroundFetch: typeof import('expo-background-fetch') | null = null;

try {
  MediaLibrary = require('expo-media-library');
} catch {
  // ExpoMediaLibraryNext native module not yet compiled in current dev binary
}

try {
  TaskManager = require('expo-task-manager');
} catch {
  // TaskManager native module not yet compiled in current dev binary
}

try {
  BackgroundFetch = require('expo-background-fetch');
} catch {
  // BackgroundFetch native module not yet compiled in current dev binary
}

export const PHOTO_BACKUP_BACKGROUND_TASK = 'photo-backup-background-task';

const LEDGER_FILENAME = 'photo-backup-ledger.json';
const BACKUP_FOLDER_NAME = 'Phone Photos';
const LEDGER_FLUSH_EVERY = 15;

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
  private backupFolderId: string | null = null;

  get isRunning(): boolean {
    return this.running;
  }

  async requestPermission(): Promise<{ granted: boolean }> {
    if (MediaLibrary?.requestPermissionsAsync) {
      const res = await MediaLibrary.requestPermissionsAsync();
      return { granted: res.granted };
    }
    const pickerRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return { granted: pickerRes.granted };
  }

  async getPermission(): Promise<{ granted: boolean }> {
    if (MediaLibrary?.getPermissionsAsync) {
      const res = await MediaLibrary.getPermissionsAsync();
      return { granted: res.granted };
    }
    const pickerRes = await ImagePicker.getMediaLibraryPermissionsAsync();
    return { granted: pickerRes.granted };
  }

  requestCancel() {
    this.cancelFlag = true;
  }

  // ---- Background Task Management -----------------------------------------

  async registerBackgroundTask(): Promise<boolean> {
    if (!TaskManager || !BackgroundFetch) return false;
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        PHOTO_BACKUP_BACKGROUND_TASK,
      );
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(PHOTO_BACKUP_BACKGROUND_TASK, {
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
      return true;
    } catch (e) {
      console.error('Failed to register photo backup background task:', e);
      return false;
    }
  }

  async unregisterBackgroundTask(): Promise<void> {
    if (!TaskManager || !BackgroundFetch) return;
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        PHOTO_BACKUP_BACKGROUND_TASK,
      );
      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(PHOTO_BACKUP_BACKGROUND_TASK);
      }
    } catch {
      // Ignored
    }
  }

  async runSilent(): Promise<BackupRunResult> {
    return this.run(() => {});
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
      // Non-fatal
    }
  }

  async backedUpCount(): Promise<number> {
    const ledger = await this.loadLedger();
    return Object.keys(ledger).length;
  }

  // ---- backup folder -------------------------------------------------------

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

    const perm = await this.getPermission();
    if (!perm.granted) return 'no-permission';

    if (!MediaLibrary) return 'error';

    this.running = true;
    this.cancelFlag = false;

    try {
      const ledger = await this.loadLedger();
      const folderId = await this.getBackupFolderId();

      // expo-media-library@56 replaced getAssetsAsync/MediaType/SortBy with a
      // Query builder. exeForMetadata() returns lightweight rows (id,
      // filename, creationTime, ...) WITHOUT resolving file paths, so it's
      // cheap to list the whole library up front; we only pay for the heavy
      // per-asset URI resolution on images we actually upload. Ordering
      // oldest-first means a partial run still makes forward progress
      // chronologically.
      const metas = await new MediaLibrary.Query()
        .eq(MediaLibrary.AssetField.MEDIA_TYPE, MediaLibrary.MediaType.IMAGE)
        .orderBy({ key: MediaLibrary.AssetField.CREATION_TIME, ascending: true })
        .exeForMetadata();

      const total = metas.length;
      let done = 0;
      let sinceFlush = 0;
      onProgress({ done, total });

      for (const meta of metas) {
        if (this.cancelFlag) {
          this.saveLedger();
          return 'cancelled';
        }

        if (ledger[meta.id]) {
          done += 1;
          onProgress({ done, total });
          continue;
        }

        try {
          // Re-instantiate the Asset from its id to reach the async getters.
          // getUri() resolves a concrete file:// URI FormData can read;
          // meta.filename can be null on Android, so fall back to the getter.
          const asset = new MediaLibrary.Asset(meta.id);
          const uri = await asset.getUri();
          const filename = meta.filename ?? (await asset.getFilename());

          await filesService.upload(
            uri,
            filename,
            mimeFromFilename(filename),
            folderId,
          );

          ledger[meta.id] = true;
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
          // Skip a single bad/unsupported asset and keep going - one bad
          // file shouldn't stall the whole backup.
        }
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

const backupService = new BackupService();

if (TaskManager && BackgroundFetch) {
  try {
    TaskManager.defineTask(PHOTO_BACKUP_BACKGROUND_TASK, async () => {
      try {
        const result = await backupService.runSilent();
        return result === 'complete'
          ? BackgroundFetch!.BackgroundFetchResult.NewData
          : BackgroundFetch!.BackgroundFetchResult.NoData;
      } catch {
        return BackgroundFetch!.BackgroundFetchResult.Failed;
      }
    });
  } catch {
    // Task already defined or error
  }
}

export default backupService;
