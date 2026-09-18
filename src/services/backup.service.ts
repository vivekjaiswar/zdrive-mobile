import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

import filesService from './files.service';
import foldersService from './folders.service';

export const PHOTO_BACKUP_BACKGROUND_TASK = 'photo-backup-background-task';

const LEDGER_FILENAME = 'photo-backup-ledger.json';
const BACKUP_FOLDER_NAME = 'Phone Photos';
const PAGE_SIZE = 50;
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

  async requestPermission(): Promise<MediaLibrary.PermissionResponse> {
    return MediaLibrary.requestPermissionsAsync();
  }

  async getPermission(): Promise<MediaLibrary.PermissionResponse> {
    return MediaLibrary.getPermissionsAsync();
  }

  requestCancel() {
    this.cancelFlag = true;
  }

  // ---- Background Task Management -----------------------------------------

  async registerBackgroundTask(): Promise<boolean> {
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

    this.running = true;
    this.cancelFlag = false;

    try {
      const ledger = await this.loadLedger();
      const folderId = await this.getBackupFolderId();

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

const backupService = new BackupService();

TaskManager.defineTask(PHOTO_BACKUP_BACKGROUND_TASK, async () => {
  try {
    const result = await backupService.runSilent();
    return result === 'complete'
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default backupService;
