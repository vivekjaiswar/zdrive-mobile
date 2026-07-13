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

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  // Renders a right-aligned eye icon that toggles show/hide instead of
  // the field staying permanently masked. This owns secureTextEntry
  // internally - don't also pass that prop when using isPassword.
  isPassword?: boolean;
}

export default function AppInput({
  containerStyle,
  style,
  isPassword,
  secureTextEntry,
  ...props
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

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
        secureTextEntry={isPassword ? !visible : secureTextEntry}
        // secureTextEntry masks the display, it does NOT reliably
        // disable autoCapitalize/autoCorrect on its own - RN's default
        // for any TextInput is autoCapitalize="sentences" and
        // autoCorrect={true}, and neither call site here (login,
        // register, change-password, reset-password) was overriding
        // that. Since isPassword already fully owns secureTextEntry,
        // it should own these too - a password field silently
        // capitalizing or "correcting" characters means what actually
        // gets submitted can differ from what the user typed, with no
        // visible sign of it (the field is masked). Force these off
        // whenever isPassword is set, regardless of what's passed in.
        autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
        autoCorrect={isPassword ? false : props.autoCorrect}
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

      {isPassword && (
        <Pressable
          hitSlop={10}
          onPress={() => setVisible((prev) => !prev)}
          style={styles.eyeButton}
        >
          <MaterialCommunityIcons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      )}
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },

    focused: {
      borderColor: colors.primary,
    },

    input: {
      flex: 1,
      fontSize: 15.5,
      color: colors.text,
    },

    eyeButton: {
      paddingLeft: 10,
    },
  });
}
