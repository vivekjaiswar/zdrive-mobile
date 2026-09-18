import { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useGlass } from '@/theme/glass';

interface Props extends TextInputProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function GlassInput({
  icon,
  isPassword,
  secureTextEntry,
  containerStyle,
  style,
  ...props
}: Props) {
  const g = useGlass();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: focused ? g.accent : g.glassBorder },
        containerStyle,
      ]}
    >
      <BlurView
        intensity={g.blurIntensity}
        tint={g.blurTint}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {/* Slightly stronger fill than a plain glass card - typed text has to
          stay readable over whatever scrolls behind the field. */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: g.glassFillStrong }]}
      />

      {icon && (
        <MaterialCommunityIcons name={icon} size={19} color={g.textSecondary} />
      )}

      <TextInput
        {...props}
        secureTextEntry={isPassword ? !visible : secureTextEntry}
        // isPassword owns these so a masked field never silently
        // auto-capitalizes/corrects what actually gets submitted.
        autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
        autoCorrect={isPassword ? false : props.autoCorrect}
        placeholderTextColor={g.textFaint}
        selectionColor={g.accent}
        style={[styles.input, { color: g.text }, style]}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />

      {isPassword && (
        <Pressable hitSlop={10} onPress={() => setVisible((v) => !v)}>
          <MaterialCommunityIcons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={g.textSecondary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15.5,
  },
});
