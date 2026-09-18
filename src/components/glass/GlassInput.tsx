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
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.025)';

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: bgFill,
          borderColor: focused ? g.accent : g.glassBorder,
        },
        containerStyle,
      ]}
    >
      {icon && (
        <MaterialCommunityIcons name={icon} size={19} color={g.textSecondary} />
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
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
});
