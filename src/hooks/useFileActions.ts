import { useState } from 'react';
import { Alert, Share } from 'react-native';
import * as Sharing from 'expo-sharing';

import filesService from '@/services/files.service';
import { ZDriveFile } from '@/types/file';

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

  // NOTE: this shares LINKS for each selected file in one message -
  // there's no backend endpoint to zip multiple files into a single
  // download, so a true "bulk download to device" would mean firing
  // the native share/save sheet once per file back-to-back, which is
  // a broken experience on both iOS and Android. Sharing all the
  // links together in one Share.share() call is the honest version
  // of this feature until a zip-export endpoint exists.
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
    bulkBusy,
    downloadingId,
    sharingId,
    deletingId,
    restoringId,
    permanentlyDeletingId,
  };
}
