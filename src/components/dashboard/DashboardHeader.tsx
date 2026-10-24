import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import Logo from '@/components/glass/Logo';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

interface Props {
  userName: string;
  avatarUrl?: string | null;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function DashboardHeader({ userName, avatarUrl }: Props) {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const initials = getInitials(userName);

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Logo size={32} showTagline={false} />
        </View>

        <View style={styles.rightActions}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/(tabs)/files')}
            hitSlop={8}
            accessibilityLabel="Search Files"
          >
            <MaterialCommunityIcons name="magnify" size={21} color={g.text} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.avatarBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/(tabs)/settings')}
            hitSlop={8}
            accessibilityLabel="Profile Settings"
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImg}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={styles.initialsWrap}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Full-Width Adaptive Greeting: never truncates names */}
      <View style={styles.greetingRow}>
        <Text style={styles.greetingText}>
          Welcome, <Text style={styles.nameText}>{userName || 'User'}</Text>
        </Text>
      </View>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      marginTop: 4,
      marginBottom: 16,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    greetingRow: {
      width: '100%',
      marginTop: 2,
    },
    greetingText: {
      fontSize: 24,
      lineHeight: 30,
      fontFamily: fonts.bold,
      color: g.text,
      letterSpacing: -0.4,
    },
    nameText: {
      fontSize: 24,
      lineHeight: 30,
      fontFamily: fonts.bold,
      color: g.accent,
      letterSpacing: -0.4,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: g.glassFill,
      borderWidth: 1,
      borderColor: g.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.94 }],
    },
    avatarBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: g.glassFill,
      borderWidth: 1.5,
      borderColor: g.accent,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    initialsWrap: {
      width: '100%',
      height: '100%',
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: g.accent,
    },
  });
}
