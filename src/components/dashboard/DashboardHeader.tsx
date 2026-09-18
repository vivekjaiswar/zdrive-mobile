import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import Logo from '@/components/glass/Logo';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  userName: string;
  avatarUrl?: string | null;
}

const NAME_COLORS = ['#3B82F6', '#A855F7', '#EC4899', '#10B981', '#F59E0B'];

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

  function renderMultiColorName(name: string) {
    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      const w = words[0];
      const mid = Math.ceil(w.length / 2);
      const p1 = w.slice(0, mid);
      const p2 = w.slice(mid);
      return (
        <Text style={styles.nameText}>
          <Text style={{ color: NAME_COLORS[0] }}>{p1}</Text>
          <Text style={{ color: NAME_COLORS[1] }}>{p2}</Text>
        </Text>
      );
    }

    return (
      <Text style={styles.nameText}>
        {words.map((word, i) => (
          <Text key={i} style={{ color: NAME_COLORS[i % NAME_COLORS.length] }}>
            {word}{i < words.length - 1 ? ' ' : ''}
          </Text>
        ))}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.brandRow}>
          <Logo size={42} markOnly />
          <Text style={styles.brandTitle}>ZDrive</Text>
        </View>

        <Text style={styles.greetingText} numberOfLines={1}>
          Welcome, {renderMultiColorName(userName)}
        </Text>
      </View>

      <View style={styles.rightActions}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => router.push('/(tabs)/files')}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={g.text} />
        </Pressable>

        <Pressable
          style={styles.avatarBtn}
          onPress={() => router.push('/(tabs)/settings')}
          hitSlop={8}
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
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 20,
    },
    left: {
      flex: 1,
      paddingRight: 12,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4,
    },
    brandTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: g.accent,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    greetingText: {
      fontSize: 20,
      fontWeight: '700',
      color: g.text,
      letterSpacing: -0.3,
    },
    nameText: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: g.glassFill,
      borderWidth: 1,
      borderColor: g.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
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
      fontSize: 16,
      fontWeight: '800',
      color: g.accent,
    },
  });
}
