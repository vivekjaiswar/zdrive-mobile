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

  return {
    download,
    share,
    rename,
    move,
    confirmDelete,
    restore,
    confirmPermanentDelete,
    downloadingId,
    sharingId,
    deletingId,
    restoringId,
    permanentlyDeletingId,
  };
}
