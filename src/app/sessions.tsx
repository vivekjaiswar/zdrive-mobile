import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '@/components/Layout/Screen';
import authService from '@/services/auth.service';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { AuthSession } from '@/types/user';

// Rough, good-enough device label from a raw User-Agent string - not a
// full parser, just enough keyword matching to tell someone "is this
// mine." Falls back to the raw string (truncated) if nothing matches.
function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';

  const ua = userAgent.toLowerCase();

  if (ua.includes('okhttp') || ua.includes('zdrive')) {
    if (ua.includes('android')) return 'ZDrive - Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      return 'ZDrive - iOS';
    }
    return 'ZDrive App';
  }

  if (ua.includes('iphone')) return 'Safari on iPhone';
  if (ua.includes('ipad')) return 'Safari on iPad';
  if (ua.includes('android')) return 'Chrome on Android';
  if (ua.includes('windows')) return 'Browser on Windows';
  if (ua.includes('mac os')) return 'Browser on Mac';

  return userAgent.length > 40 ? `${userAgent.slice(0, 40)}...` : userAgent;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SessionsScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);

  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, []),
  );

  async function loadSessions() {
    try {
      const data = await authService.listSessions();
      setSessions(data);
    } catch (e: any) {
      console.error('Failed to load sessions:', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, []);

  function handleRevoke(session: AuthSession) {
    Alert.alert(
      'Log Out This Device?',
      `This will end the session on ${describeDevice(session.userAgent)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setRevokingId(session.id);
              await authService.revokeSession(session.id);
              await loadSessions();
            } catch (error: any) {
              Alert.alert(
                'Failed',
                error?.response?.data?.message ?? 'Could not revoke that session.',
              );
            } finally {
              setRevokingId(null);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </Pressable>

        <Text style={styles.topBarTitle}>Active Sessions</Text>

        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name={item.current ? 'cellphone-check' : 'cellphone'}
                size={19}
                color={colors.primary}
              />
            </View>

            <View style={styles.rowText}>
              <Text style={styles.device}>
                {describeDevice(item.userAgent)}
                {item.current ? '  ·  This device' : ''}
              </Text>
              <Text style={styles.meta}>
                {item.ipAddress ?? 'Unknown IP'} · Last active {formatWhen(item.lastSeenAt)}
              </Text>
            </View>

            {!item.current && (
              <Pressable
                hitSlop={10}
                disabled={revokingId === item.id}
                onPress={() => handleRevoke(item)}
              >
                {revokingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Text style={styles.revoke}>Log Out</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      />
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },

    topBarTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },

    list: {
      marginTop: 8,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },

    rowText: {
      flex: 1,
    },

    device: {
      fontSize: 14.5,
      fontWeight: '600',
      color: colors.text,
    },

    meta: {
      marginTop: 2,
      fontSize: 12.5,
      color: colors.textSecondary,
    },

    revoke: {
      color: colors.danger,
      fontWeight: '700',
      fontSize: 13.5,
    },
  });
}
