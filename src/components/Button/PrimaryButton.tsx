import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
  onPress: () => void;
}

export default function PrimaryButton({
  title,
  loading = false,
  disabled = false,
  variant = 'primary',
  onPress,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'danger' && styles.buttonDanger,
        pressed && styles.pressed,
        (loading || disabled) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    button: {
      height: 54,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',

      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },

    buttonDanger: {
      backgroundColor: colors.danger,
    },

    pressed: {
      opacity: 0.9,
    },

    disabled: {
      opacity: 0.7,
    },

    text: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },
  });
}
