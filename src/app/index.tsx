import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ZDrive</Text>
      <Text style={styles.subtitle}>Cloud Storage</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2563EB',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: '#6B7280',
  },
});