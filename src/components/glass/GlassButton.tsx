import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import GoogleLogo from '@/components/common/GoogleLogo';
import { useGlass } from '@/theme/glass';

type Variant = 'primary' | 'glass' | 'google' | 'danger';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export default function GlassButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}: Props) {
  const g = useGlass();
  const busy = loading || disabled;

  const labelColor =
    variant === 'primary'
      ? g.onAccent
      : variant === 'danger'
        ? g.danger
        : g.text;

  const bgFill =
    variant === 'primary'
      ? undefined
      : g.scheme === 'dark'
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.03)';

  const body = loading ? (
    <ActivityIndicator color={variant === 'primary' ? g.onAccent : g.accent} />
  ) : (
    <View style={styles.row}>
      {variant === 'google' ? (
        <GoogleLogo size={20} />
      ) : (
        icon && <MaterialCommunityIcons name={icon} size={19} color={labelColor} />
      )}
      <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: bgFill,
          borderColor: g.glassBorder,
        },
        pressed && styles.pressed,
        busy && styles.busy,
        style,
      ]}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={g.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  busy: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 15.5, fontWeight: '700' },
});
