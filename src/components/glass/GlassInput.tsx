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
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

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

  const bgFill =
    g.scheme === 'dark'
      ? focused
        ? 'rgba(99, 91, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.05)'
      : focused
      ? 'rgba(255, 255, 255, 0.9)'
      : 'rgba(255, 255, 255, 0.65)';

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: bgFill,
          borderColor: focused ? g.accent : g.glassBorder,
          shadowColor: focused ? g.accent : 'transparent',
          shadowOpacity: focused ? 0.25 : 0,
          shadowRadius: 10,
        },
        containerStyle,
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={focused ? g.accent : g.textSecondary}
        />
      )}

      <TextInput
        {...props}
        secureTextEntry={isPassword ? !visible : secureTextEntry}
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
    borderWidth: 1.2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
});
