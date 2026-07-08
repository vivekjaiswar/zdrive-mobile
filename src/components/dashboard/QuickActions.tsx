import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import Colors from '@/theme/colors';
import ActionCard from './ActionCard';
import { useFileUpload } from '@/hooks/useFileUpload';

interface Props {
  // Called after a successful upload so the dashboard can refresh
  // storage stats.
  onUploaded?: () => void;
}

export default function QuickActions({ onUploaded }: Props) {
  const router = useRouter();
  const { uploading, pickAndUpload } = useFileUpload();

  async function handleUpload() {
    const uploaded = await pickAndUpload();

    if (uploaded) {
      onUploaded?.();
    }
  }

  function handleCreateFolder() {
    // Folder creation is intentionally not wired yet: there's no
    // folder browsing screen to view the result in (that's the
    // Folder Explorer feature). Wiring "create" without any way to
    // see what you created isn't a complete feature - see it built
    // together with the explorer instead of as a dead-end dialog now.
    Alert.alert(
      'Coming Soon',
      'Folder creation is being built together with folder browsing.',
    );
  }

  function handleTrash() {
    // Same reasoning: there's no Trash screen/route yet (Priority 6).
    Alert.alert('Coming Soon', 'Trash is not built yet.');
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

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },

  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 18,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  space: {
    width: 14,
  },
});
