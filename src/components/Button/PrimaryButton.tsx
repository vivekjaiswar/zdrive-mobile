import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

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

const styles = StyleSheet.create({
  button: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#2563EB',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  buttonDanger: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
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
    fontSize: 17,
  },
});