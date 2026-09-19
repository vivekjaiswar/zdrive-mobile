import { useState } from 'react';
import { Alert, Share } from 'react-native';
import * as Sharing from 'expo-sharing';

import filesService, { MAX_BULK_DOWNLOAD_IDS } from '@/services/files.service';
import { ZDriveFile } from '@/types/file';
import { ZDriveFolder } from '@/types/folder';

// Shared by the Files list's long-press action sheet and the file
// preview screen's quick download/share icons, so both stay in sync
// with the same backend contracts instead of duplicating them.
export function useFileActions(onChanged?: () => void) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [permanentlyDeletingId, setPermanentlyDeletingId] = useState<
    string | null
  >(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function download(file: Pick<ZDriveFile, 'id' | 'name'>) {
    try {
      setDownloadingId(file.id);

      const downloaded = await filesService.download(file.id, file.name);
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        // No sandboxed-app-visible "Downloads" folder to drop this
        // into - the system share/save sheet is how the user actually
        // keeps it somewhere.
        await Sharing.shareAsync(downloaded.uri);
      } else {
        Alert.alert('Downloaded', `Saved to ${downloaded.uri}`);
      }
    } catch (error: any) {
      Alert.alert(
        'Download Failed',
        error?.response?.data?.message ?? 'Unable to download this file.',
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function share(file: Pick<ZDriveFile, 'id'>) {
    try {
      setSharingId(file.id);

      const { absoluteUrl } = await filesService.share(file.id);

      await Share.share({ message: absoluteUrl });
    } catch (error: any) {
      Alert.alert(
        'Share Failed',
        error?.response?.data?.message ?? 'Unable to create a share link.',
      );
    } finally {
      setSharingId(null);
    }
  }

  async function rename(
    file: Pick<ZDriveFile, 'id' | 'name'>,
    name: string,
  ): Promise<boolean> {
    if (!name || name === file.name) return false;

    try {
      await filesService.rename(file.id, name);
      onChanged?.();
      return true;
    } catch (error: any) {
      Alert.alert(
        'Rename Failed',
        error?.response?.data?.message ?? 'Unable to rename this file.',
      );
      return false;
    }
  }

  async function move(
    file: Pick<ZDriveFile, 'id'>,
    folderId: string | undefined,
  ): Promise<boolean> {
    try {
      await filesService.move(file.id, folderId);
      onChanged?.();
      return true;
    } catch (error: any) {
      Alert.alert(
        'Move Failed',
        error?.response?.data?.message ?? 'Unable to move this file.',
      );
      return false;
    }
  }

  function confirmDelete(file: Pick<ZDriveFile, 'id' | 'name'>) {
    Alert.alert(
      'Move to Trash?',
      `"${file.name}" will be moved to trash.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(file.id);
              await filesService.delete(file.id);
              onChanged?.();
            } catch (error: any) {
              Alert.alert(
                'Delete Failed',
                error?.response?.data?.message ??
                  'Unable to delete this file.',
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  }

  async function restore(file: Pick<ZDriveFile, 'id' | 'name'>) {
    try {
      setRestoringId(file.id);
      await filesService.restore(file.id);
      onChanged?.();
    } catch (error: any) {
      Alert.alert(
        'Restore Failed',
        error?.response?.data?.message ?? 'Unable to restore this file.',
      );
    } finally {
      setRestoringId(null);
    }
  }

  function confirmPermanentDelete(file: Pick<ZDriveFile, 'id' | 'name'>) {
    Alert.alert(
      'Delete Forever?',
      `"${file.name}" will be permanently deleted. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              setPermanentlyDeletingId(file.id);
              await filesService.permanentlyDelete(file.id);
              onChanged?.();
            } catch (error: any) {
              Alert.alert(
                'Delete Failed',
                error?.response?.data?.message ??
                  'Unable to permanently delete this file.',
              );
            } finally {
              setPermanentlyDeletingId(null);
            }
          },
        },
      ],
    );
  }

  // Bulk delete/move/share for multi-select. There's no batch endpoint
  // on the backend - each is a Promise.allSettled fan-out over the
  // existing single-item calls, so a handful of individual failures
  // (e.g. one file mid-move by another request) don't abort the rest.
  function confirmBulkDelete(
    files: Pick<ZDriveFile, 'id' | 'name'>[],
    onDone: () => void,
  ) {
    if (files.length === 0) return;

    Alert.alert(
      'Move to Trash?',
      `${files.length} file${files.length === 1 ? '' : 's'} will be moved to trash.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBulkBusy(true);
            const results = await Promise.allSettled(
              files.map((file) => filesService.delete(file.id)),
            );
            setBulkBusy(false);

            const failed = results.filter((r) => r.status === 'rejected').length;
            onChanged?.();
            onDone();

            if (failed > 0) {
              Alert.alert(
                'Some Deletes Failed',
                `${failed} of ${files.length} files could not be deleted.`,
              );
            }
          },
        },
      ],
    );
  }

  async function bulkMove(
    files: Pick<ZDriveFile, 'id'>[],
    folderId: string | undefined,
  ): Promise<void> {
    setBulkBusy(true);
    const results = await Promise.allSettled(
      files.map((file) => filesService.move(file.id, folderId)),
    );
    setBulkBusy(false);

    const failed = results.filter((r) => r.status === 'rejected').length;
    onChanged?.();

    if (failed > 0) {
      Alert.alert(
        'Some Moves Failed',
        `${failed} of ${files.length} files could not be moved.`,
      );
    }
  }

  // NOTE: this shares LINKS for each selected file in one message, not
  // an actual zip of the files themselves - that's what bulkDownload()
  // below is for (added once the backend's zip-export endpoint
  // shipped on 2026-07-15). Kept separate on purpose: this is for
  // "send someone a link to these files," bulkDownload is for "save
  // these files to my own device."
  async function bulkShare(files: Pick<ZDriveFile, 'id'>[]): Promise<void> {
    setBulkBusy(true);

    const results = await Promise.allSettled(
      files.map((file) => filesService.share(file.id)),
    );

    setBulkBusy(false);

    const links = results
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof filesService.share>>> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value.absoluteUrl);

    const failed = results.length - links.length;

    if (links.length === 0) {
      Alert.alert('Share Failed', 'Unable to create share links for the selected files.');
      return;
    }

    await Share.share({ message: links.join('\n') });

    if (failed > 0) {
      Alert.alert(
        'Some Shares Failed',
        `${failed} of ${files.length} files could not be shared.`,
      );
    }
  }

  // Real zip download for multi-select, backed by the bulk-download-
  // ticket + bulk-download/content endpoints. The ticket expires 60s
  // after issuance - that's only the window to *start* the zip
  // request, not a cap on the download itself, so there's no need to
  // race anything here beyond not sitting on the ticket unused.
  //
  // Known limitation: if the backend has to skip any files (malware
  // scan flagged, since-deleted, etc.) it lists them in a
  // _download-errors.txt inside the zip instead of erroring - this
  // doesn't parse the zip to surface that, so a partial download
  // currently looks identical to a complete one from the UI's
  // perspective. Worth revisiting if that turns out to matter.
  async function bulkDownload(
    files: Pick<ZDriveFile, 'id'>[] = [],
    folders: Pick<ZDriveFolder, 'id' | 'name'>[] = [],
  ): Promise<void> {
    if (files.length === 0 && folders.length === 0) return;

    if (files.length > MAX_BULK_DOWNLOAD_IDS) {
      Alert.alert(
        'Too Many Files Selected',
        `You can download up to ${MAX_BULK_DOWNLOAD_IDS} files at once - you have ${files.length} selected.`,
      );
      return;
    }

    setBulkBusy(true);

    try {
      const fileIds = files.map((file) => file.id);
      const folderIds = folders.map((folder) => folder.id);

      const ticket = await filesService.requestBulkDownloadTicket(
        fileIds,
        folderIds,
      );

      const filename =
        folders.length === 1 && files.length === 0
          ? `${folders[0].name}.zip`
          : `ZDrive Archive (${ticket.fileCount} files).zip`;

      const downloaded = await filesService.downloadBulkZip(
        ticket.downloadUrl,
        filename,
      );

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(downloaded.uri);
      } else {
        Alert.alert('Downloaded Archive', `Saved to ${downloaded.uri}`);
      }
    } catch (error: any) {
      Alert.alert(
        'Download Failed',
        error?.response?.data?.message ?? 'Unable to download this zip archive.',
      );
    } finally {
      setBulkBusy(false);
    }
  }

  async function downloadFolderZip(
    folder: Pick<ZDriveFolder, 'id' | 'name'>,
  ): Promise<void> {
    return bulkDownload([], [folder]);
  }

  return {
    download,
    share,
    rename,
    move,
    confirmDelete,
    restore,
    confirmPermanentDelete,
    confirmBulkDelete,
    bulkMove,
    bulkShare,
    bulkDownload,
    downloadFolderZip,
    bulkBusy,
    downloadingId,
    sharingId,
    deletingId,
    restoringId,
    permanentlyDeletingId,
  };
}
