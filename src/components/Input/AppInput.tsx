import { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export default function AppInput({
  containerStyle,
  style,
  ...props
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        focused && styles.focused,
        containerStyle,
      ]}
    >
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.primary}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      height: 54,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },

    focused: {
      borderColor: colors.primary,
    },

    input: {
      fontSize: 15.5,
      color: colors.text,
    },
  });
}
