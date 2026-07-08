import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '@/theme/colors';

interface Props {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title?: string;
  subtitle?: string;
}

export default function EmptyFiles({
  icon = 'folder-open-outline',
  title = 'No Files Yet',
  subtitle = 'Upload your first document to start using ZDrive.',
}: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={90}
        color="#CBD5E1"
      />

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 90,
    alignItems: 'center',
  },

  title: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});
