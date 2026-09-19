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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import Screen from '@/components/Layout/Screen';
import ZoomableImage from '@/components/files/ZoomableImage';
import VideoPreview from '@/components/files/VideoPreview';
import AudioPlayer from '@/components/files/AudioPlayer';
import PdfPreview from '@/components/files/PdfPreview';
import FileVersionModal from '@/components/files/FileVersionModal';
import filesService from '@/services/files.service';
import { useFileActions } from '@/hooks/useFileActions';
import { useFilePreviewStore } from '@/store/filePreview.store';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { FileDetails } from '@/types/file';

const SWIPE_X_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 300;

function isTextLike(mimeType?: string): boolean {
  if (!mimeType) return false;
  if (mimeType.startsWith('text/')) return true;

  const codeTypes = [
    'application/json',
    'application/javascript',
    'application/typescript',
    'application/xml',
    'application/x-yaml',
    'application/x-python',
    'application/x-sh',
    'application/x-sql',
    'application/csv',
  ];

  return codeTypes.includes(mimeType);
}

export default function FileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);

  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);

  const { download, share, downloadingId, sharingId } = useFileActions();

  const fileIds = useFilePreviewStore((state) => state.fileIds);
  const currentIndex = fileIds.indexOf(id ?? '');
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < fileIds.length - 1;

  function navigateTo(targetId: string) {
    router.replace(`/files/${targetId}`);
  }

  function goPrev() {
    if (hasPrev) navigateTo(fileIds[currentIndex - 1]);
  }

  function goNext() {
    if (hasNext) navigateTo(fileIds[currentIndex + 1]);
  }

  useFocusEffect(
    useCallback(() => {
      if (id) loadDetails(id);
    }, [id]),
  );

  async function loadDetails(fileId: string) {
    try {
      setLoading(true);
      setTextContent(null);
      setTextError(false);
      const data = await filesService.details(fileId);
      setFile(data);
    } catch {
      Alert.alert('Error', 'Unable to load file details.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (isZoomed) return;

      const distanceOk = Math.abs(e.translationX) > SWIPE_X_THRESHOLD;
      const velocityOk = Math.abs(e.velocityX) > SWIPE_VELOCITY_THRESHOLD;

      if (!distanceOk && !velocityOk) return;

      if (e.translationX < 0) {
        runOnJS(goPrev)();
      } else {
        runOnJS(goNext)();
      }
    });

  useEffect(() => {
    if (!file || !isTextLike(file.mimeType) || !file.previewUrl) return;

    let cancelled = false;

    async function loadText() {
      try {
        setTextLoading(true);
        setTextError(false);

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
          <Pressable hitSlop={10} onPress={() => setVersionModalVisible(true)}>
            <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
          </Pressable>

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

      <GestureDetector gesture={swipeGesture}>
        {isImage ? (
          <View style={styles.imageWrap}>
            <ZoomableImage uri={file.previewUrl} onZoomChange={setIsZoomed} />
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
              <ActivityIndicator size="small" color={colors.primary} />
            ) : textError ? (
              <Text style={styles.textError}>Failed to load file contents.</Text>
            ) : (
              <Text style={styles.textBody} selectable>
                {textContent}
              </Text>
            )}
          </ScrollView>
        ) : (
          <View style={styles.unsupportedWrap}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.unsupportedTitle}>No Preview Available</Text>
            <Text style={styles.unsupportedSub}>
              {file.mimeType || 'Unknown file type'}
            </Text>
            <Pressable style={styles.openButton} onPress={openExternally}>
              <Text style={styles.openButtonText}>Open in External App</Text>
            </Pressable>
          </View>
        )}
      </GestureDetector>

      <FileVersionModal
        visible={versionModalVisible}
        fileId={file.id}
        fileName={file.name}
        onClose={() => setVersionModalVisible(false)}
      />
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    topBarTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    quickActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageWrap: {
      flex: 1,
      backgroundColor: '#000000',
    },
    audioWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    pdfWrap: {
      flex: 1,
    },
    textScroll: {
      flex: 1,
      paddingHorizontal: 16,
    },
    textContent: {
      paddingVertical: 16,
    },
    textBody: {
      fontFamily: 'monospace',
      fontSize: 13,
      lineHeight: 20,
      color: colors.text,
    },
    textError: {
      fontSize: 14,
      color: colors.error,
      textAlign: 'center',
      marginTop: 20,
    },
    unsupportedWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 32,
    },
    unsupportedTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    unsupportedSub: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    openButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    openButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}
