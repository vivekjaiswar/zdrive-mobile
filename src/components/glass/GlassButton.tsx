import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

// One button, four looks:
//  primary - filled accent gradient (the main CTA)
//  glass   - frosted/translucent (secondary actions on a glass screen)
//  google  - light frosted with the Google glyph
//  danger  - frosted with danger-tinted label
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

  const label =
    variant === 'primary'
      ? g.onAccent
      : variant === 'danger'
        ? g.danger
        : g.text;

  const body = loading ? (
    <ActivityIndicator color={variant === 'primary' ? g.onAccent : g.accent} />
  ) : (
    <View style={styles.row}>
      {(icon || variant === 'google') && (
        <MaterialCommunityIcons
          name={variant === 'google' ? 'google' : icon!}
          size={19}
          color={label}
        />
      )}
      <Text style={[styles.label, { color: label }]}>{title}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.wrap,
        { borderColor: g.glassBorder },
        pressed && styles.pressed,
        busy && styles.busy,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={g.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <>
          <BlurView
            intensity={g.blurIntensity}
            tint={g.blurTint}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: g.glassFill }]}
          />
        </>
      )}
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  busy: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  label: { fontSize: 16, fontWeight: '700' },
});
