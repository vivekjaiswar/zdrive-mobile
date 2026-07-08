import { View, Text, StyleSheet } from 'react-native';

import Screen from '@/components/Layout/Screen';

export default function SharedScreen() {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.center}>
        <Text style={styles.title}>Shared</Text>
        <Text>Coming Soon</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
});
