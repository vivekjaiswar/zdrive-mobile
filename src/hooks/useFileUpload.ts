import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import filesService from '@/services/files.service';
import { UploadResponse } from '@/types/file';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  async function pickAndUpload(
    folderId?: string,
  ): Promise<UploadResponse | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    const asset = result.assets[0];

    try {
      setUploading(true);

      const uploaded = await filesService.upload(
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/octet-stream',
        folderId,
      );

      return uploaded;
    } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error?.response?.data?.message ??
          'Unable to upload this file.',
      );

      return null;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, pickAndUpload };
}
