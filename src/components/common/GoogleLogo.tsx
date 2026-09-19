import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

interface Props {
  size?: number;
}

export default function GoogleLogo({ size = 20 }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <MaterialCommunityIcons name="google" size={size} color="#4285F4" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
