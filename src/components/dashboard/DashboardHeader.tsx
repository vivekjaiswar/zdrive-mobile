import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  username: string;
}

export default function DashboardHeader({ username }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const hour = new Date().getHours();

  let greeting = 'Good evening';

  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>

      <Text style={styles.username} numberOfLines={2}>
        {username}
      </Text>

      <Text style={styles.subtitle}>Welcome back to your cloud.</Text>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      marginTop: 8,
      marginBottom: 28,
    },

    greeting: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },

    username: {
      marginTop: 6,
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: colors.text,
    },

    subtitle: {
      marginTop: 8,
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 21,
    },
  });
}
