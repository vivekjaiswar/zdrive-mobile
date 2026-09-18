import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

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

  // Shared upload loop for both pickers. Sequential (the backend's
  // /storage/upload takes one file per request - there's no multi-file
  // endpoint); stops the batch on a subscription-expired error since every
  // remaining file would fail identically.
  async function uploadAssets(
    assets: { uri: string; name: string; mimeType: string }[],
    folderId?: string,
  ): Promise<UploadBatchResult> {
    const uploaded: UploadResponse[] = [];
    const failed: string[] = [];

    try {
      setUploading(true);

      for (let i = 0; i < assets.length; i++) {
        setProgress({ current: i + 1, total: assets.length });
        const asset = assets[i];

        try {
          const response = await filesService.upload(
            asset.uri,
            asset.name,
            asset.mimeType,
            folderId,
          );
          uploaded.push(response);
        } catch (error: any) {
          if (isSubscriptionExpiredError(error)) {
            for (let j = i; j < assets.length; j++) {
              failed.push(assets[j].name);
            }

            Alert.alert(
              'Subscription Expired',
              'Your plan has expired, so new uploads are paused. Renew or check your current plan in Settings to continue uploading.',
              [
                { text: 'Later', style: 'cancel' },
                { text: 'View Plan', onPress: () => router.push('/(tabs)/settings') },
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

  // Pick any files via the system file picker (permission-free SAF/Files).
  async function pickAndUpload(
    folderId?: string,
  ): Promise<UploadBatchResult | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return null;

    return uploadAssets(
      result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? 'application/octet-stream',
      })),
      folderId,
    );
  }

  // Pick from the photo gallery. Requests media-library permission first -
  // this is the permission prompt the user sees the first time - then
  // uploads the chosen images/videos through the same endpoint.
  async function pickPhotosAndUpload(
    folderId?: string,
  ): Promise<UploadBatchResult | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photo Access Needed',
        'Allow photo access to upload from your gallery. You can enable it anytime in your phone Settings.',
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return null;

    return uploadAssets(
      result.assets.map((a, i) => {
        const mimeType = a.mimeType ?? 'image/jpeg';
        const ext = mimeType.split('/')[1] ?? 'jpg';
        return {
          uri: a.uri,
          name: a.fileName ?? `upload-${Date.now()}-${i}.${ext}`,
          mimeType,
        };
      }),
      folderId,
    );
  }

  return { uploading, progress, pickAndUpload, pickPhotosAndUpload };
}
