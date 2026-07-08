import { useState } from 'react';
import { Alert } from 'react-native';

import foldersService from '@/services/folders.service';
import { ZDriveFolder } from '@/types/folder';

// Shared by the root "My Drive" screen and the Folder Explorer screen
// so both stay consistent about how rename/delete errors surface.
export function useFolderActions(onChanged?: () => void) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function rename(
    folder: Pick<ZDriveFolder, 'id' | 'name'>,
    name: string,
  ): Promise<boolean> {
    if (!name || name === folder.name) return false;

    try {
      await foldersService.rename(folder.id, name);
      onChanged?.();
      return true;
    } catch (error: any) {
      Alert.alert(
        'Rename Failed',
        error?.response?.data?.message ?? 'Unable to rename this folder.',
      );
      return false;
    }
  }

  function confirmDelete(folder: Pick<ZDriveFolder, 'id' | 'name'>) {
    Alert.alert(
      'Delete Folder?',
      `"${folder.name}" will be permanently deleted. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(folder.id);
              await foldersService.delete(folder.id);
              onChanged?.();
            } catch (error: any) {
              // Backend rejects non-empty folders with a specific
              // message ("Folder contains files"/"...child folders")
              // - show it verbatim, it's more useful than a generic one.
              Alert.alert(
                'Delete Failed',
                error?.response?.data?.message ??
                  'Unable to delete this folder.',
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  }

  return { rename, confirmDelete, deletingId };
}
