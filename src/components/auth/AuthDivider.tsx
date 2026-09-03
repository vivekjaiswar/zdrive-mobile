import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

// "──— or ——─" separator between the primary email/password action and the
// Google sign-in button. Shared so login and register look identical.
export default function AuthDivider({ label = 'or' }: { label?: string }) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    line: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },

    label: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
