import { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import GlassCard from '@/components/glass/GlassCard';
import filesService from '@/services/files.service';
import { FileVersion } from '@/types/file';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

interface Props {
  visible: boolean;
  fileId: string | null;
  fileName?: string;
  onClose: () => void;
  onVersionUploaded?: () => void;
}

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function FileVersionModal({
  visible,
  fileId,
  fileName,
  onClose,
  onVersionUploaded,
}: Props) {
  const g = useGlass();
  const styles = getStyles(g);

  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingVersion, setUploadingVersion] = useState(false);

  useEffect(() => {
    if (visible && fileId) {
      loadVersions(fileId);
    }
  }, [visible, fileId]);

  async function loadVersions(id: string) {
    try {
      setLoading(true);
      const data = await filesService.getVersions(id);
      setVersions(data);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadNewVersion() {
    if (!fileId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setUploadingVersion(true);
      await filesService.uploadVersion(
        fileId,
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/octet-stream',
      );
      await loadVersions(fileId);
      onVersionUploaded?.();
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.response?.data?.message ?? 'Could not upload new version.');
    } finally {
      setUploadingVersion(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <BlurView intensity={g.blurIntensity + 15} tint={g.blurTint} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: g.glassFillStrong }]} />

          <View style={styles.sheetContent}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>File Version History</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {fileName ?? 'Revisions track past edits to this file.'}
                </Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={20} color={g.text} />
              </Pressable>
            </View>

            <Pressable
              style={styles.uploadBtn}
              disabled={uploadingVersion}
              onPress={handleUploadNewVersion}
            >
              {uploadingVersion ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.uploadBtnText}>Upload New Version</Text>
                </>
              )}
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={g.accent} />
                </View>
              ) : versions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="history" size={32} color={g.textFaint} />
                  <Text style={styles.emptyTitle}>Version v1 (Current)</Text>
                  <Text style={styles.emptySub}>
                    No previous revisions recorded. Uploading a file with the same name creates new version entries.
                  </Text>
                </View>
              ) : (
                versions.map((ver, idx) => {
                  const isLatest = idx === 0;

                  return (
                    <GlassCard key={ver.id} radius={18} padding={14} style={styles.versionCard}>
                      <View style={styles.row}>
                        <View style={styles.iconCircle}>
                          <MaterialCommunityIcons name="file-clock-outline" size={20} color={g.accent} />
                        </View>
                        <View style={styles.info}>
                          <View style={styles.tagRow}>
                            <Text style={styles.verTitle}>Version {ver.versionNumber ?? (versions.length - idx)}</Text>
                            {isLatest && (
                              <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>CURRENT</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.verMeta}>
                            {formatSize(ver.size)} • {new Date(ver.createdAt).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    sheetContainer: {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: g.glassBorder,
      height: '60%',
    },
    sheetContent: {
      flex: 1,
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 24,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: g.glassBorder,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontFamily: fonts.heading,
      fontSize: 24,
      color: g.text,
      letterSpacing: -0.3,
    },
    subtitle: {
      marginTop: 4,
      fontFamily: fonts.regular,
      fontSize: 13,
      color: g.textSecondary,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: g.glassFill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: g.accent,
      borderRadius: 14,
      paddingVertical: 12,
      marginBottom: 16,
    },
    uploadBtnText: {
      color: '#fff',
      fontFamily: fonts.bold,
      fontSize: 14,
    },
    scroll: {
      paddingBottom: 20,
    },
    loadingWrap: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: 28,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: fonts.bold,
      fontSize: 15,
      color: g.text,
    },
    emptySub: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      lineHeight: 18,
      color: g.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    versionCard: {
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    verTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 14.5,
      color: g.text,
    },
    currentBadge: {
      backgroundColor: g.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    currentBadgeText: {
      fontFamily: fonts.bold,
      fontSize: 10,
      color: g.accent,
    },
    verMeta: {
      marginTop: 2,
      fontFamily: fonts.medium,
      fontSize: 12,
      color: g.textSecondary,
    },
  });
}
