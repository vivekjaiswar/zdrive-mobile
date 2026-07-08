import { View, Text, StyleSheet } from 'react-native';

export default function SharedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared</Text>
      <Text>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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