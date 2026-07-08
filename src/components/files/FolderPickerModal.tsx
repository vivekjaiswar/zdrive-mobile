import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import foldersService from '@/services/folders.service';
import { ZDriveFolder } from '@/types/folder';
import Colors from '@/theme/colors';

interface Props {
  visible: boolean;
  // The file's current folder, if any - highlighted in the list.
  currentFolderId?: string | null;
  // True while a move request triggered from onSelect is in flight -
  // disables the list so a second tap can't fire a duplicate move.
  submitting?: boolean;
  onCancel: () => void;
  onSelect: (folderId: string | undefined) => void;
}

export default function FolderPickerModal({
  visible,
  currentFolderId,
  submitting = false,
  onCancel,
  onSelect,
}: Props) {
  const [folders, setFolders] = useState<ZDriveFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadFolders();
    }
  }, [visible]);

  async function loadFolders() {
    try {
      setLoading(true);
      const data = await foldersService.list();
      setFolders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <Text style={styles.title}>Move to</Text>
            {submitting && (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
          </View>

          {/*
            NOTE: this only lists root-level folders - GET /folders
            doesn't return nested subfolders, and there's no folder
            browsing UI yet to drill into one from here. Moving into
            a subfolder isn't possible from this picker until Folder
            Explorer exists.
          */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loading}
            />
          ) : (
            <FlatList
              data={folders}
              keyExtractor={(item) => item.id}
              style={styles.list}
              scrollEnabled={!submitting}
              ListHeaderComponent={
                <Pressable
                  style={[styles.row, submitting && styles.rowDisabled]}
                  disabled={submitting}
                  onPress={() => onSelect(undefined)}
                >
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons
                      name="home-outline"
                      size={22}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.rowText}>My Drive (Root)</Text>
                  {!currentFolderId && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </Pressable>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.row, submitting && styles.rowDisabled]}
                  disabled={submitting}
                  onPress={() => onSelect(item.id)}
                >
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons
                      name="folder-outline"
                      size={22}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.rowText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {currentFolderId === item.id && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  No folders yet - files can only move to My Drive for now.
                </Text>
              }
            />
          )}

          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '70%',
  },

  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },

  rowDisabled: {
    opacity: 0.4,
  },

  loading: {
    marginVertical: 40,
  },

  list: {
    flexGrow: 0,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },

  empty: {
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },

  cancelButton: {
    marginTop: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },

  cancelText: {
    fontWeight: '700',
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
