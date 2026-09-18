import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search files...',
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="magnify"
        size={21}
        color={colors.textSecondary}
      />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      height: 50,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,

      flexDirection: 'row',
      alignItems: 'center',

      paddingHorizontal: 16,
    },

    input: {
      flex: 1,
      marginLeft: 10,
      color: colors.text,
      fontSize: 15,
    },
  });
}