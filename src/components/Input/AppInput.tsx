import { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

interface Props extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

export default function AppInput({
  containerStyle,
  style,
  ...props
}: Props) {
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
        placeholderTextColor="#94A3B8"
        selectionColor="#2563EB"
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

const styles = StyleSheet.create({
  container: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E7FF',
    backgroundColor: '#FAFCFF',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  focused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },

  input: {
    fontSize: 16,
    color: '#0F172A',
  },
});