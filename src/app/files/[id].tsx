import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import Screen from '@/components/Layout/Screen';
import filesService from '@/services/files.service';
import { useFileActions } from '@/hooks/useFileActions';
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
  if (mime.includes('video')) return 'file-video';
  if (mime.includes('audio')) return 'file-music';
  if (mime.includes('zip')) return 'folder-zip';
  return 'file-outline' as const;
}

// Text-ish mime types we can safely fetch and render as plain text.
// Anything else (pdf/video/audio/binary) falls back to "open
// externally" - there's no embedded PDF/video/audio player installed
// in this project yet, and adding one mid-session risks needing a
// native rebuild.
function isTextLike(mime?: string) {
  if (!mime) return false;
  if (mime.startsWith('text/')) return true;
  return [
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-yaml',
  ].includes(mime);
}

export default function FilePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState(false);

  const { download, share, downloadingId, sharingId } = useFileActions();

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

  useEffect(() => {
    if (!file || !isTextLike(file.mimeType) || !file.previewUrl) return;

    let cancelled = false;

    async function loadText() {
      try {
        setTextLoading(true);
        setTextError(false);

        // previewUrl is a pre-signed S3 URL, already authenticated -
        // a plain fetch works, no Authorization header needed (and
        // none of our axios interceptors should touch this request).
        const response = await fetch(file!.previewUrl);
        const text = await response.text();

        if (!cancelled) setTextContent(text);
      } catch {
        if (!cancelled) setTextError(true);
      } finally {
        if (!cancelled) setTextLoading(false);
      }
    }

    loadText();

    return () => {
      cancelled = true;
    };
  }, [file?.id]);

  function openExternally() {
    if (!file) return;

    Linking.openURL(file.previewUrl).catch(() => {
      Alert.alert('Unable to Open', 'No app on this device can open this file.');
    });
  }

  if (loading || !file) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  const isImage = file.mimeType?.startsWith('image/');
  const isText = isTextLike(file.mimeType);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={Colors.text} />
        </Pressable>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {file.name}
        </Text>

        <View style={styles.quickActions}>
          <Pressable
            hitSlop={10}
            onPress={() => download(file)}
            disabled={downloadingId === file.id}
          >
            {downloadingId === file.id ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="download-outline"
                size={24}
                color={Colors.primary}
              />
            )}
          </Pressable>

          <Pressable
            hitSlop={10}
            onPress={() => share(file)}
            disabled={sharingId === file.id}
          >
            {sharingId === file.id ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={22}
                color={Colors.primary}
              />
            )}
          </Pressable>
        </View>
      </View>

      {isImage ? (
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: file.previewUrl }}
            style={styles.image}
            contentFit="contain"
            transition={150}
          />
        </View>
      ) : isText ? (
        <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
          {textLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : textError ? (
            <Text style={styles.fallbackMessage}>
              Couldn't load a preview for this file.
            </Text>
          ) : (
            <Text style={styles.textBody}>{textContent}</Text>
          )}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name={iconFor(file.mimeType)}
            size={72}
            color={Colors.primary}
          />

          <Text style={styles.fileName} numberOfLines={2}>
            {file.name}
          </Text>

          <Text style={styles.meta}>
            {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
          </Text>

          <Text style={styles.fallbackMessage}>
            In-app preview isn't available for this file type yet.
          </Text>

          <Pressable style={styles.openButton} onPress={openExternally}>
            <MaterialCommunityIcons name="open-in-new" size={18} color="#FFFFFF" />
            <Text style={styles.openButtonText}>Open Externally</Text>
          </Pressable>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },

  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },

  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  imageWrap: {
    flex: 1,
    backgroundColor: '#0B1120',
    marginHorizontal: -24,
    marginBottom: -24,
  },

  image: {
    flex: 1,
  },

  textScroll: {
    flex: 1,
    marginHorizontal: -24,
  },

  textContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  textBody: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text,
  },

  fileName: {
    marginTop: 20,
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

  fallbackMessage: {
    marginTop: 20,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  openButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },

  openButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
