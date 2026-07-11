import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { RecentFile, RecentFolder } from '@/services/dashboard.service';

interface Props {
  files: RecentFile[];
  folders: RecentFolder[];
  onFilePress: (file: RecentFile) => void;
  onFolderPress: (folder: RecentFolder) => void;
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

// Backed entirely by data /dashboard/stats already returns on every
// load - recentFiles/recentFolders were fetched by the app since day
// one but never rendered anywhere until now.
export default function RecentActivity({ files, folders, onFilePress, onFolderPress }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  if (files.length === 0 && folders.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recent</Text>

      {folders.length > 0 && (
        <View style={styles.folderRow}>
          {folders.map((folder) => (
            <Pressable
              key={folder.id}
              style={styles.folderChip}
              onPress={() => onFolderPress(folder)}
            >
              <MaterialCommunityIcons name="folder" size={17} color={colors.primary} />
              <Text numberOfLines={1} style={styles.folderChipText}>
                {folder.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {files.length > 0 && (
        <View style={styles.card}>
          {files.map((file, index) => (
            <Pressable
              key={file.id}
              onPress={() => onFilePress(file)}
              style={[
                styles.fileRow,
                index === files.length - 1 && styles.fileRowLast,
              ]}
            >
              <MaterialCommunityIcons
                name={iconFor(file.mimeType)}
                size={19}
                color={colors.primary}
              />

              <Text numberOfLines={1} style={styles.fileName}>
                {file.name}
              </Text>

              <Text style={styles.fileDate}>
                {new Date(file.createdAt).toLocaleDateString()}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      marginTop: 32,
    },

    heading: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },

    folderRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 14,
    },

    folderChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      maxWidth: 160,
      borderWidth: 1,
      borderColor: colors.border,
    },

    folderChipText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: colors.text,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    fileRowLast: {
      borderBottomWidth: 0,
    },

    fileName: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: '600',
      color: colors.text,
    },

    fileDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
}
