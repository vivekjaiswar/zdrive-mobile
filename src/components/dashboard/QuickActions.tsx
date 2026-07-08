import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/theme/colors';
import ActionCard from './ActionCard';

export default function QuickActions() {
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
          onPress={() => {}}
        />

        <View style={styles.space} />

        <ActionCard
          icon="folder-plus-outline"
          title="Folder"
          subtitle="Create"
          onPress={() => {}}
        />
      </View>

      <View style={styles.row}>
        <ActionCard
          icon="share-variant-outline"
          title="Shared"
          subtitle="Links"
          onPress={() => {}}
        />

        <View style={styles.space} />

        <ActionCard
          icon="delete-outline"
          title="Trash"
          subtitle="Restore"
          onPress={() => {}}
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