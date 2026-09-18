import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import GlassCard from '@/components/glass/GlassCard';
import { RecentFile, RecentFolder } from '@/services/dashboard.service';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  files: RecentFile[];
  folders: RecentFolder[];
  onFilePress: (file: RecentFile) => void;
  onFolderPress: (folder: RecentFolder) => void;
}

function getFileIcon(mime: string = ''): keyof typeof MaterialCommunityIcons.glyphMap {
  if (mime.includes('pdf')) return 'file-pdf-box';
  if (mime.includes('image')) return 'file-image';
  if (mime.includes('video')) return 'file-video';
  if (mime.includes('audio')) return 'file-music';
  return 'file-outline';
}

function formatDate(isoDate: string) {
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      if (diffHours < 1) return 'Just now';
      return `${Math.floor(diffHours)}h ago`;
    }
    if (diffHours < 48) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export default function RecentActivity({
  files,
  folders,
  onFilePress,
  onFolderPress,
}: Props) {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const hasItems = files.length > 0 || folders.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <Pressable onPress={() => router.push('/(tabs)/files')} hitSlop={8}>
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      </View>

      <GlassCard strong padding={6} radius={24}>
        {!hasItems ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={g.textFaint} />
            <Text style={styles.emptyText}>No recent files</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {folders.map((folder) => (
              <Pressable
                key={`folder-${folder.id}`}
                style={styles.row}
                onPress={() => onFolderPress(folder)}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name="folder" size={20} color={g.accent} />
                </View>

                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {folder.name}
                  </Text>
                  <Text style={styles.rowMeta}>Folder • {formatDate(folder.createdAt)}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={18} color={g.textFaint} />
              </Pressable>
            ))}

            {files.map((file) => (
              <Pressable
                key={`file-${file.id}`}
                style={styles.row}
                onPress={() => onFilePress(file)}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name={getFileIcon(file.mimeType)} size={20} color={g.accent} />
                </View>

                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.rowMeta}>{formatDate(file.createdAt)}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={18} color={g.textFaint} />
              </Pressable>
            ))}
          </View>
        )}
      </GlassCard>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 13,
      fontWeight: '600',
      color: g.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: '600',
      color: g.accent,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      gap: 6,
    },
    emptyText: {
      fontSize: 13,
      color: g.textSecondary,
    },
    list: {
      paddingVertical: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowInfo: {
      flex: 1,
    },
    rowName: {
      fontSize: 14.5,
      fontWeight: '600',
      color: g.text,
      letterSpacing: -0.2,
    },
    rowMeta: {
      marginTop: 2,
      fontSize: 12,
      color: g.textSecondary,
    },
  });
}
