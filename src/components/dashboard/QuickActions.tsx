import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import ActionCard from './ActionCard';
import { useFileUpload } from '@/hooks/useFileUpload';

interface Props {
  // Called after a successful upload so the dashboard can refresh
  // storage stats.
  onUploaded?: () => void;
}

export default function QuickActions({ onUploaded }: Props) {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);
  const { uploading, pickAndUpload } = useFileUpload();

  async function handleUpload() {
    const result = await pickAndUpload();

    if (result && result.uploaded.length > 0) {
      onUploaded?.();
    }
  }

  function handleCreateFolder() {
    // Files screen picks this up via useLocalSearchParams and opens
    // the create-folder sheet immediately (see files.tsx).
    router.push('/(tabs)/files?createFolder=1');
  }

  function handleTrash() {
    router.push('/trash');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Quick Actions
      </Text>

      <View style={styles.row}>
        <ActionCard
          icon="cloud-upload-outline"
          title="Upload"
          subtitle="New File"
          onPress={handleUpload}
          loading={uploading}
        />

        <View style={styles.space} />

        <ActionCard
          icon="folder-plus-outline"
          title="Folder"
          subtitle="Create"
          onPress={handleCreateFolder}
        />
      </View>

      <View style={styles.row}>
        <ActionCard
          icon="share-variant-outline"
          title="Shared"
          subtitle="Links"
          onPress={() => router.push('/(tabs)/shared')}
        />

        <View style={styles.space} />

        <ActionCard
          icon="delete-outline"
          title="Trash"
          subtitle="Restore"
          onPress={handleTrash}
        />
      </View>
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

    row: {
      flexDirection: 'row',
      marginBottom: 12,
    },

    space: {
      width: 12,
    },
  });
}
