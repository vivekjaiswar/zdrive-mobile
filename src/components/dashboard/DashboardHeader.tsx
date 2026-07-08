import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/theme/colors';

interface Props {
  username: string;
}

export default function DashboardHeader({
  username,
}: Props) {
  const hour = new Date().getHours();

  let greeting = 'Good Evening';

  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        {greeting}
      </Text>

      <Text style={styles.username}>
        {username} !
      </Text>

      <Text style={styles.subtitle}>
        Welcome back to your cloud storage.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 26,
  },

  greeting: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  username: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
  },

  subtitle: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
});