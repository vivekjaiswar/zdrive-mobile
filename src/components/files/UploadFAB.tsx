import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import Colors from '@/theme/colors';

interface Props {
  onPress: () => void;
}

export default function UploadFAB({
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && {
          opacity: 0.9,
          transform: [{ scale: 0.97 }],
        },
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name="plus"
        size={26}
        color="#FFFFFF"
      />

      <Text style={styles.text}>
        Upload
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',

    right: 22,
    bottom: 28,

    height: 60,

    borderRadius: 30,

    paddingHorizontal: 24,

    backgroundColor: Colors.primary,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: Colors.primary,

    shadowOpacity: 0.35,

    shadowRadius: 18,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 10,
  },

  text: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
});