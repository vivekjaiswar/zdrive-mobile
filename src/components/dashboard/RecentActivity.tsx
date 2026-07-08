import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '@/theme/colors';
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
              <MaterialCommunityIcons name="folder" size={18} color={Colors.primary} />
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
                size={20}
                color={Colors.primary}
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

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },

  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
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
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    maxWidth: 160,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  folderChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
  },

  fileRowLast: {
    borderBottomWidth: 0,
  },

  fileName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },

  fileDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
