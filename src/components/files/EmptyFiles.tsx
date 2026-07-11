import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title?: string;
  subtitle?: string;
}

export default function EmptyFiles({
  icon = 'folder-open-outline',
  title = 'No files yet',
  subtitle = 'Upload your first document to start using ZDrive.',
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={44} color={colors.textSecondary} />
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      marginTop: 80,
      alignItems: 'center',
    },

    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },

    title: {
      marginTop: 20,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },

    subtitle: {
      marginTop: 8,
      fontSize: 14.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      paddingHorizontal: 32,
    },
  });
}
