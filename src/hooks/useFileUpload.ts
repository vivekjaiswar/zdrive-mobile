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

function isUuidOrToken(name: string): boolean {
  const base = name.replace(/\.[^/.]+$/, '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const hexHashRegex = /^[0-9a-f]{20,}$/i;
  return uuidRegex.test(base) || hexHashRegex.test(base);
}

async function resolveMediaFilename(
  asset: ImagePicker.ImagePickerAsset,
  index: number,
  isVideo: boolean,
): Promise<string> {
  const ext = asset.mimeType?.split('/')[1] || (isVideo ? 'mp4' : 'jpg');
  const cleanExt = ext === 'jpeg' ? 'jpg' : ext;

  // 1. Try resolving original name from native MediaLibrary if assetId is present
  if (asset.assetId) {
    try {
      const MediaLibrary = require('expo-media-library');
      if (MediaLibrary?.Asset) {
        const mlAsset = new MediaLibrary.Asset(asset.assetId);
        const realName = await mlAsset.getFilename();
        if (realName && !isUuidOrToken(realName)) {
          return realName;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Check asset.fileName if it's already a real human name (not a UUID/token)
  if (asset.fileName && !isUuidOrToken(asset.fileName)) {
    return asset.fileName;
  }

  // 3. Fallback: Generate a clean, natural name with date and time
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const suffix = index > 0 ? `_${index + 1}` : '';
  const prefix = isVideo ? 'Video' : 'Photo';

  return `${prefix}_${dateStr}_${timeStr}${suffix}.${cleanExt}`;
}

  // Pick from the photo gallery. Requests media-library permission first -
  // this is the permission prompt the user sees the first time - then
  // uploads the chosen images/videos with their real device filenames.
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

    const mappedAssets = await Promise.all(
      result.assets.map(async (a, i) => {
        const isVideo = a.type === 'video' || a.mimeType?.startsWith('video/') || false;
        const mimeType = a.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg');
        const name = await resolveMediaFilename(a, i, isVideo);
        return {
          uri: a.uri,
          name,
          mimeType,
        };
      }),
    );

    return uploadAssets(mappedAssets, folderId);
  }

  return { uploading, progress, pickAndUpload, pickPhotosAndUpload };
}
