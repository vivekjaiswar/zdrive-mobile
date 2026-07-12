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

import Screen from '@/components/Layout/Screen';
import ZoomableImage from '@/components/files/ZoomableImage';
import VideoPreview from '@/components/files/VideoPreview';
import AudioPlayer from '@/components/files/AudioPlayer';
import PdfPreview from '@/components/files/PdfPreview';
import filesService from '@/services/files.service';
import { useFileActions } from '@/hooks/useFileActions';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
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
// Anything else that isn't image/video/audio/pdf falls back to "open
// externally".
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
  const colors = useColors();
  const styles = getStyles(colors);

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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const isAudio = file.mimeType?.startsWith('audio/');
  const isPdf = file.mimeType === 'application/pdf';
  const isText = isTextLike(file.mimeType);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
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
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="download-outline"
                size={24}
                color={colors.primary}
              />
            )}
          </Pressable>

          <Pressable
            hitSlop={10}
            onPress={() => share(file)}
            disabled={sharingId === file.id}
          >
            {sharingId === file.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={22}
                color={colors.primary}
              />
            )}
          </Pressable>
        </View>
      </View>

      {isImage ? (
        <View style={styles.imageWrap}>
          <ZoomableImage uri={file.previewUrl} />
        </View>
      ) : isVideo ? (
        <View style={styles.imageWrap}>
          <VideoPreview uri={file.previewUrl} />
        </View>
      ) : isAudio ? (
        <View style={styles.audioWrap}>
          <AudioPlayer uri={file.previewUrl} name={file.name} />
        </View>
      ) : isPdf ? (
        <View style={styles.pdfWrap}>
          <PdfPreview uri={file.previewUrl} />
        </View>
      ) : isText ? (
        <ScrollView style={styles.textScroll} contentContainerStyle={styles.textContent}>
          {textLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
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
            color={colors.primary}
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

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
      letterSpacing: -0.3,
      color: colors.text,
    },

    quickActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
    },

    // Intentionally always this near-black navy regardless of
    // light/dark mode - a neutral photo-viewer backdrop, same choice
    // ZoomableImage's surrounding chrome has used from the start.
    imageWrap: {
      flex: 1,
      backgroundColor: '#0B1120',
      marginHorizontal: -24,
      marginBottom: -24,
    },

    audioWrap: {
      flex: 1,
      marginHorizontal: -24,
      marginBottom: -24,
    },

    pdfWrap: {
      flex: 1,
      marginHorizontal: -24,
      marginBottom: -24,
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
      color: colors.text,
    },

    fileName: {
      marginTop: 20,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },

    meta: {
      marginTop: 6,
      fontSize: 14,
      color: colors.textSecondary,
    },

    fallbackMessage: {
      marginTop: 20,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    openButton: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 16,

      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },

    openButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
