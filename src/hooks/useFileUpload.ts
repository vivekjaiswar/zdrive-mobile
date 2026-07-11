import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import filesService from '@/services/files.service';
import { UploadResponse } from '@/types/file';

export interface UploadBatchResult {
  uploaded: UploadResponse[];
  failed: string[];
}

// storage.service.ts's uploadFile() throws this exact BadRequestException
// message when subscriptionStatus isn't ACTIVE or subscriptionExpiresAt
// has passed. Matched on substring since the backend could still be
// tweaking exact wording - this only affects which alert gets shown,
// never whether the upload was actually blocked.
function isSubscriptionExpiredError(error: any): boolean {
  const message: string = error?.response?.data?.message ?? '';
  return message.toLowerCase().includes('subscription has expired');
}

export interface UploadProgress {
  current: number;
  total: number;
}

export function useFileUpload() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  async function pickAndUpload(
    folderId?: string,
  ): Promise<UploadBatchResult | null> {
    // Backend's /storage/upload uses NestJS's FileInterceptor('file'),
    // which only ever accepts one file per request - there's no
    // multi-file endpoint. Multi-select here just means picking many
    // files client-side and uploading them one at a time.
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    const assets = result.assets;
    const uploaded: UploadResponse[] = [];
    const failed: string[] = [];

    try {
      setUploading(true);

      // Sequential, not Promise.all - uploading many files at once
      // would compete for the same connection with no way to show
      // meaningful progress, and one bad file shouldn't abort the
      // rest of the batch.
      for (let i = 0; i < assets.length; i++) {
        setProgress({ current: i + 1, total: assets.length });
        const asset = assets[i];

        try {
          const response = await filesService.upload(
            asset.uri,
            asset.name,
            asset.mimeType ?? 'application/octet-stream',
            folderId,
          );
          uploaded.push(response);
        } catch (error: any) {
          // Every remaining file would fail for the exact same reason,
          // so stop the batch immediately instead of burning through
          // the rest of the queue one confusing failure at a time.
          if (isSubscriptionExpiredError(error)) {
            for (let j = i; j < assets.length; j++) {
              failed.push(assets[j].name);
            }

            Alert.alert(
              'Subscription Expired',
              'Your plan has expired, so new uploads are paused. Renew or check your current plan in Settings to continue uploading.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'View Plan',
                  onPress: () => router.push('/(tabs)/settings'),
                },
              ],
            );

            return { uploaded, failed };
          }

          failed.push(asset.name);
        }
      }

      if (failed.length > 0) {
        Alert.alert(
          uploaded.length > 0 ? 'Some Uploads Failed' : 'Upload Failed',
          failed.length === 1
            ? `"${failed[0]}" could not be uploaded.`
            : `${failed.length} files could not be uploaded:\n${failed.join(', ')}`,
        );
      }

      return { uploaded, failed };
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  return { uploading, progress, pickAndUpload };
}
