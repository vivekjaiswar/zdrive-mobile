import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import unzipService, { ZipEntryInfo } from '@/services/unzip.service';
import { useReleaseAdminStore } from '@/store/releaseAdmin.store';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';
import { FileDetails } from '@/types/file';

interface Props {
  file: FileDetails;
  onExtracted?: (folderId?: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getFileIcon(name: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return 'file-image';
    case 'mp4':
    case 'mov':
    case 'mkv':
      return 'file-video';
    case 'mp3':
    case 'wav':
      return 'file-music';
    case 'pdf':
      return 'file-pdf-box';
    case 'json':
    case 'js':
    case 'ts':
    case 'html':
    case 'css':
      return 'file-code';
    default:
      return 'file-document-outline';
  }
}

export default function ZipPreview({ file, onExtracted }: Props) {
  const g = useGlass();
  const styles = getStyles(g);

  const [entries, setEntries] = useState<ZipEntryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; filename: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadArchive() {
      try {
        setLoading(true);
        const list = await unzipService.listEntries(file.previewUrl);
        if (!cancelled) setEntries(list);
      } catch (err: any) {
        console.warn('Could not inspect zip contents:', err?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadArchive();

    return () => {
      cancelled = true;
    };
  }, [file.id, file.previewUrl]);

  const fileEntries = entries.filter((e) => !e.isDirectory);
  const totalUncompressedSize = fileEntries.reduce((sum, e) => sum + e.size, 0);
  const zipExtractionEnabled = useReleaseAdminStore((s) => s.featureFlags.zipExtraction);

  async function handleExtract() {
    if (!zipExtractionEnabled) {
      Alert.alert(
        'Feature Unavailable',
        'ZIP extraction has been temporarily paused by administrator.',
      );
      return;
    }
    Alert.alert(
      'Extract Archive',
      `Unzip ${fileEntries.length} files from "${file.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Extract into Folder',
          onPress: async () => {
            try {
              setExtracting(true);
              const result = await unzipService.extractZip(file, {
                targetFolderId: file.folderId ?? undefined,
                createSubfolder: true,
                onProgress: (p) => setProgress(p),
              });

              Alert.alert(
                'Extraction Complete',
                `Successfully unzipped ${result.extractedCount} files into a new folder.`,
                [
                  {
                    text: 'View Folder',
                    onPress: () => onExtracted?.(result.destinationFolderId),
                  },
                ],
              );
            } catch (err: any) {
              Alert.alert('Extraction Failed', err?.message ?? 'Unable to extract archive.');
            } finally {
              setExtracting(false);
              setProgress(null);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* Archive Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="folder-zip" size={38} color="#FF6A00" />
        </View>

        <Text style={styles.archiveTitle} numberOfLines={1}>
          {file.name}
        </Text>

        <Text style={styles.archiveMeta}>
          {fileEntries.length} {fileEntries.length === 1 ? 'file' : 'files'} ·{' '}
          {formatSize(totalUncompressedSize || Number(file.size))} uncompressed
        </Text>

        <Pressable
          style={styles.extractButton}
          onPress={handleExtract}
          disabled={extracting}
        >
          <MaterialCommunityIcons name="archive-arrow-down" size={20} color="#FFFFFF" />
          <Text style={styles.extractButtonText}>
            {extracting ? 'Extracting Archive…' : 'Unzip & Extract Files'}
          </Text>
        </Pressable>
      </View>

      {/* Archive Contents List */}
      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Archive Contents</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={g.accent} />
            <Text style={styles.loadingText}>Reading archive files…</Text>
          </View>
        ) : (
          <FlatList
            data={fileEntries}
            keyExtractor={(item) => item.path}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.entryRow}>
                <View style={styles.entryIconWrap}>
                  <MaterialCommunityIcons
                    name={getFileIcon(item.name)}
                    size={20}
                    color={g.accent}
                  />
                </View>

                <View style={styles.entryInfo}>
                  <Text style={styles.entryName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.entryPath} numberOfLines={1}>
                    {item.path}
                  </Text>
                </View>

                <Text style={styles.entrySize}>{formatSize(item.size)}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Extracting Modal / Progress Dialog */}
      <Modal visible={extracting} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <BlurView intensity={30} tint={g.blurTint} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: g.glassFillStrong }]} />

            <View style={styles.modalInner}>
              <ActivityIndicator size="large" color="#FF6A00" />
              <Text style={styles.modalTitle}>Extracting Archive</Text>

              {progress ? (
                <>
                  <Text style={styles.modalStatus}>
                    Extracting file {progress.current} of {progress.total}
                  </Text>
                  <Text style={styles.modalFilename} numberOfLines={1}>
                    {progress.filename}
                  </Text>
                </>
              ) : (
                <Text style={styles.modalStatus}>Decompressing contents…</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    headerCard: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
      borderRadius: 24,
      backgroundColor: g.glassFillStrong,
      borderWidth: 1,
      borderColor: g.glassBorder,
      shadowColor: '#FF6A00',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 3,
    },
    iconCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'rgba(255, 106, 0, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    archiveTitle: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: g.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    archiveMeta: {
      fontSize: 12.5,
      fontFamily: fonts.medium,
      color: g.textSecondary,
      marginBottom: 16,
    },
    extractButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#FF6A00',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 14,
      shadowColor: '#FF6A00',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    extractButtonText: {
      fontSize: 14.5,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
    },
    listContainer: {
      flex: 1,
      marginTop: 16,
      backgroundColor: g.glassFillStrong,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: g.glassBorder,
      overflow: 'hidden',
    },
    listHeader: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: g.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    loadingBox: {
      padding: 30,
      alignItems: 'center',
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: g.textSecondary,
    },
    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 16,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: g.glassBorder,
      gap: 10,
    },
    entryIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    entryInfo: {
      flex: 1,
    },
    entryName: {
      fontSize: 13.5,
      fontFamily: fonts.semiBold,
      color: g.text,
    },
    entryPath: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: g.textFaint,
      marginTop: 2,
    },
    entrySize: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: g.textSecondary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 320,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    modalInner: {
      padding: 26,
      alignItems: 'center',
      gap: 12,
    },
    modalTitle: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: g.text,
      marginTop: 6,
    },
    modalStatus: {
      fontSize: 13.5,
      fontFamily: fonts.medium,
      color: g.textSecondary,
      textAlign: 'center',
    },
    modalFilename: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: g.accent,
      textAlign: 'center',
    },
  });
}
