import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PermissionsModal({ visible, onClose }: Props) {
  const g = useGlass();
  const styles = getStyles(g);

  const [photoStatus, setPhotoStatus] = useState<string>('Checking...');
  const [cameraStatus, setCameraStatus] = useState<string>('Checking...');

  useEffect(() => {
    if (visible) checkPermissions();
  }, [visible]);

  async function checkPermissions() {
    try {
      const media = await ImagePicker.getMediaLibraryPermissionsAsync();
      setPhotoStatus(media.granted ? 'Granted' : media.canAskAgain ? 'Not Granted' : 'Blocked');

      const cam = await ImagePicker.getCameraPermissionsAsync();
      setCameraStatus(cam.granted ? 'Granted' : cam.canAskAgain ? 'Not Granted' : 'Blocked');
    } catch {
      setPhotoStatus('Manage in Settings');
      setCameraStatus('Manage in Settings');
    }
  }

  async function handleRequestPhotos() {
    try {
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (res.granted) {
        setPhotoStatus('Granted');
        Alert.alert('Permission Granted', 'Photo & Gallery access is active.');
      } else if (!res.canAskAgain) {
        Linking.openSettings();
      } else {
        setPhotoStatus('Not Granted');
      }
    } catch {
      Linking.openSettings();
    }
  }

  async function handleRequestCamera() {
    try {
      const res = await ImagePicker.requestCameraPermissionsAsync();
      if (res.granted) {
        setCameraStatus('Granted');
        Alert.alert('Permission Granted', 'Camera access is active.');
      } else if (!res.canAskAgain) {
        Linking.openSettings();
      } else {
        setCameraStatus('Not Granted');
      }
    } catch {
      Linking.openSettings();
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
                <Text style={styles.title}>System Permissions</Text>
                <Text style={styles.subtitle}>Manage OS permissions required for ZDrive features.</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={20} color={g.text} />
              </Pressable>
            </View>

            <View style={styles.list}>
              {/* Photo & Gallery Permission */}
              <GlassCard radius={20} padding={16} style={styles.card}>
                <Pressable style={styles.row} onPress={handleRequestPhotos}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={22} color={g.accent} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Photos & Gallery</Text>
                    <Text style={styles.rowDesc}>Upload photos and videos from device gallery</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, photoStatus === 'Granted' && { color: g.success }]}>
                      {photoStatus}
                    </Text>
                  </View>
                </Pressable>
              </GlassCard>

              {/* Files & Document Picker */}
              <GlassCard radius={20} padding={16} style={styles.card}>
                <Pressable style={styles.row} onPress={handleRequestPhotos}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="folder-outline" size={22} color={g.accent} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Files & File Manager</Text>
                    <Text style={styles.rowDesc}>Access document picker for PDF, ZIP & code files</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, { color: g.success }]}>Active (SAF)</Text>
                  </View>
                </Pressable>
              </GlassCard>

              {/* Camera Permission */}
              <GlassCard radius={20} padding={16} style={styles.card}>
                <Pressable style={styles.row} onPress={handleRequestCamera}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="camera-outline" size={22} color={g.accent} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>Camera</Text>
                    <Text style={styles.rowDesc}>Capture photos directly to upload to ZDrive</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={[styles.badgeText, cameraStatus === 'Granted' && { color: g.success }]}>
                      {cameraStatus}
                    </Text>
                  </View>
                </Pressable>
              </GlassCard>

              {/* Open Android System Settings */}
              <Pressable style={styles.openSettingsBtn} onPress={() => Linking.openSettings()}>
                <MaterialCommunityIcons name="cog-outline" size={18} color={g.accent} />
                <Text style={styles.openSettingsText}>Open Android System Settings</Text>
              </Pressable>
            </View>
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
    },
    sheetContent: {
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 32,
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
      marginBottom: 18,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: g.text,
      letterSpacing: -0.4,
    },
    subtitle: {
      marginTop: 4,
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
    list: {
      gap: 10,
    },
    card: {
      marginBottom: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: g.text,
    },
    rowDesc: {
      marginTop: 2,
      fontSize: 12,
      color: g.textSecondary,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: g.accentSoft,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: g.textSecondary,
    },
    openSettingsBtn: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: g.accentSoft,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    openSettingsText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: g.accent,
    },
  });
}
