import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';

import Screen from '@/components/Layout/Screen';
import FileActionRow from '@/components/files/FileActionRow';
import TextPromptModal from '@/components/common/TextPromptModal';
import FolderPickerModal from '@/components/files/FolderPickerModal';
import filesService from '@/services/files.service';
import Colors from '@/theme/colors';
import { FileDetails } from '@/types/file';

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function iconFor(mime?: string) {
  if (!mime) return 'file-outline';
  if (mime.includes('pdf')) return 'file-pdf-box';
  if (mime.includes('image')) return 'file-image';
  if (mime.includes('video')) return 'file-video';
  if (mime.includes('audio')) return 'file-music';
  if (mime.includes('zip')) return 'folder-zip';
  return 'file-outline' as const;
}

export default function FileDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [moveVisible, setMoveVisible] = useState(false);
  const [moving, setMoving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFile();
    }, [id]),
  );

  async function loadFile() {
    if (!id) return;

    try {
      setLoading(true);
      const data = await filesService.details(id);
      setFile(data);
    } catch (error: any) {
      Alert.alert(
        'Unable to load file',
        error?.response?.data?.message ?? 'This file may have been removed.',
      );
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!file) return;

    try {
      setDownloading(true);

      const downloaded = await filesService.download(file.id, file.name);

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        // There's no "Downloads" folder a sandboxed Expo app can drop
        // a file into and have the user find later - handing off to
        // the system share/save sheet is the standard way to let the
        // user actually keep it somewhere (Files app, Drive, etc.).
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
      setDownloading(false);
    }
  }

  async function handleShare() {
    if (!file) return;

    try {
      setSharing(true);

      const { absoluteUrl } = await filesService.share(file.id);

      await Share.share({
        message: absoluteUrl,
      });
    } catch (error: any) {
      Alert.alert(
        'Share Failed',
        error?.response?.data?.message ?? 'Unable to create a share link.',
      );
    } finally {
      setSharing(false);
    }
  }

  async function handleRename(name: string) {
    if (!file || !name || name === file.name) {
      setRenameVisible(false);
      return;
    }

    try {
      setRenaming(true);
      const updated = await filesService.rename(file.id, name);
      setFile({ ...file, name: updated.name });
      setRenameVisible(false);
    } catch (error: any) {
      Alert.alert(
        'Rename Failed',
        error?.response?.data?.message ?? 'Unable to rename this file.',
      );
    } finally {
      setRenaming(false);
    }
  }

  async function handleMove(folderId: string | undefined) {
    if (!file) return;

    try {
      setMoving(true);
      await filesService.move(file.id, folderId);
      setMoveVisible(false);
      Alert.alert('Moved', 'File moved successfully.');
    } catch (error: any) {
      Alert.alert(
        'Move Failed',
        error?.response?.data?.message ?? 'Unable to move this file.',
      );
    } finally {
      setMoving(false);
    }
  }

  function handleDelete() {
    if (!file) return;

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
              setDeleting(true);
              await filesService.delete(file.id);
              router.back();
            } catch (error: any) {
              Alert.alert(
                'Delete Failed',
                error?.response?.data?.message ??
                  'Unable to delete this file.',
              );
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (loading || !file) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  const isImage = file.mimeType?.startsWith('image/');

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={26}
            color={Colors.text}
          />
        </Pressable>

        <Text style={styles.topBarTitle}>File Details</Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.previewCard}>
          {isImage && file.previewUrl ? (
            <Image
              source={{ uri: file.previewUrl }}
              style={styles.previewImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={iconFor(file.mimeType)}
                size={56}
                color={Colors.primary}
              />
            </View>
          )}

          <Text style={styles.fileName} numberOfLines={2}>
            {file.name}
          </Text>

          <Text style={styles.meta}>
            {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <FileActionRow
            icon="download-outline"
            label="Download"
            onPress={handleDownload}
            loading={downloading}
          />

          <FileActionRow
            icon="share-variant-outline"
            label="Share"
            onPress={handleShare}
            loading={sharing}
          />

          <FileActionRow
            icon="pencil-outline"
            label="Rename"
            onPress={() => setRenameVisible(true)}
          />

          <FileActionRow
            icon="folder-move-outline"
            label="Move"
            onPress={() => setMoveVisible(true)}
          />

          <FileActionRow
            icon="trash-can-outline"
            label="Delete"
            onPress={handleDelete}
            loading={deleting}
            destructive
          />
        </View>
      </ScrollView>

      <TextPromptModal
        visible={renameVisible}
        title="Rename File"
        initialValue={file.name}
        confirmLabel="Rename"
        loading={renaming}
        onCancel={() => setRenameVisible(false)}
        onConfirm={handleRename}
      />

      <FolderPickerModal
        visible={moveVisible}
        onCancel={() => setMoveVisible(false)}
        onSelect={handleMove}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },

  previewCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 12,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#EEF5FF',
  },

  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  fileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },

  meta: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.textSecondary,
  },

  actions: {
    marginTop: 24,
    marginBottom: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
