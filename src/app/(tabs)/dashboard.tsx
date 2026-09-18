import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import GlassScreen from '@/components/glass/GlassScreen';
import GlassCard from '@/components/glass/GlassCard';
import Logo from '@/components/glass/Logo';
import dashboardService, { DashboardStats } from '@/services/dashboard.service';
import { useAuthStore } from '@/store/auth.store';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScroll';
import { GlassTheme, useGlass } from '@/theme/glass';

function formatBytes(value: string | number) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fileIcon(mime: string): keyof typeof MaterialCommunityIcons.glyphMap {
  if (!mime) return 'file-outline';
  if (mime.includes('pdf')) return 'file-pdf-box';
  if (mime.includes('image')) return 'file-image';
  if (mime.includes('video')) return 'file-video';
  if (mime.includes('audio')) return 'file-music';
  return 'file-outline';
}

export default function DashboardScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);
  const user = useAuthStore((state) => state.user);
  const tabBarHeight = useTabBarHeight();
  const { uploading, pickAndUpload } = useFileUpload();
  const onScroll = useTabBarScrollHandler();

  const [stats, setStats] = useState<DashboardStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  async function loadDashboard() {
    try {
      setStats(await dashboardService.getStats());
    } catch (e: any) {
      console.error('Failed to load dashboard stats:', e?.message ?? 'Unknown error');
    }
  }

  async function handleUpload() {
    const result = await pickAndUpload();
    if (result && result.uploaded.length > 0) loadDashboard();
  }

  const name = stats?.userName ?? user?.email.split('@')[0] ?? 'there';
  const pct = stats?.storagePercent ?? 0;

  const actions = [
    { icon: 'cloud-upload-outline' as const, label: 'Upload', onPress: handleUpload, busy: uploading },
    { icon: 'folder-plus-outline' as const, label: 'New Folder', onPress: () => router.push('/(tabs)/files?createFolder=1') },
    { icon: 'share-variant-outline' as const, label: 'Shared', onPress: () => router.push('/(tabs)/shared') },
    { icon: 'trash-can-outline' as const, label: 'Trash', onPress: () => router.push('/trash') },
  ];

  return (
    <GlassScreen edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingTop: 8 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {name}</Text>
            <Text style={styles.subGreeting}>Welcome back to your cloud</Text>
          </View>
          <Logo size={30} markOnly />
        </View>

        {/* Storage */}
        <GlassCard padding={20} radius={24} style={styles.block}>
          <View style={styles.storageTop}>
            <View>
              <Text style={styles.storageLabel}>Storage used</Text>
              <Text style={styles.storageValue}>
                {formatBytes(stats?.storageUsed ?? 0)}
                <Text style={styles.storageLimit}>
                  {' '}/ {formatBytes(stats?.storageLimit ?? 0)}
                </Text>
              </Text>
            </View>
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>{pct}%</Text>
            </View>
          </View>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(pct, 100)}%` }]} />
          </View>

          <View style={styles.statsRow}>
            <Stat g={g} icon="file-outline" value={stats?.fileCount ?? 0} label="Files" />
            <Stat g={g} icon="folder-outline" value={stats?.folderCount ?? 0} label="Folders" />
            <Stat g={g} icon="share-variant-outline" value={stats?.sharedFiles ?? 0} label="Shared" />
          </View>
        </GlassCard>

        {/* Quick actions */}
        <View style={styles.actionsGrid}>
          {actions.map((a) => (
            <Pressable key={a.label} style={styles.actionWrap} onPress={a.onPress} disabled={a.busy}>
              <GlassCard padding={16} radius={20} style={a.busy ? styles.actionBusy : undefined}>
                <View style={styles.actionInner}>
                  <View style={styles.actionIcon}>
                    <MaterialCommunityIcons name={a.icon} size={22} color={g.accent} />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        {/* Recent */}
        <Text style={styles.sectionTitle}>Recent</Text>
        <GlassCard strong padding={6} radius={22} style={styles.block}>
          {stats && stats.recentFolders.length === 0 && stats.recentFiles.length === 0 ? (
            <Text style={styles.empty}>Nothing here yet. Upload a file to get started.</Text>
          ) : (
            <>
              {stats?.recentFolders.map((folder) => (
                <Pressable
                  key={folder.id}
                  style={styles.row}
                  onPress={() => router.push(`/folders/${folder.id}`)}
                >
                  <View style={styles.rowIcon}>
                    <MaterialCommunityIcons name="folder" size={20} color={g.accent} />
                  </View>
                  <Text style={styles.rowName} numberOfLines={1}>{folder.name}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={g.textFaint} />
                </Pressable>
              ))}
              {stats?.recentFiles.map((file) => (
                <Pressable
                  key={file.id}
                  style={styles.row}
                  onPress={() => router.push(`/files/${file.id}`)}
                >
                  <View style={styles.rowIcon}>
                    <MaterialCommunityIcons name={fileIcon(file.mimeType)} size={20} color={g.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.rowMeta}>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={g.textFaint} />
                </Pressable>
              ))}
            </>
          )}
        </GlassCard>
      </ScrollView>
    </GlassScreen>
  );
}

function Stat({
  g,
  icon,
  value,
  label,
}: {
  g: GlassTheme;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <MaterialCommunityIcons name={icon} size={16} color={g.textSecondary} />
      <Text style={{ color: g.text, fontWeight: '700', fontSize: 14 }}>{value}</Text>
      <Text style={{ color: g.textSecondary, fontSize: 12.5 }}>{label}</Text>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    greeting: { fontSize: 26, fontWeight: '800', color: g.text, letterSpacing: -0.5 },
    subGreeting: { marginTop: 3, fontSize: 14, color: g.textSecondary },
    block: { marginBottom: 18 },

    storageTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    storageLabel: { fontSize: 13, color: g.textSecondary, fontWeight: '600' },
    storageValue: { marginTop: 4, fontSize: 20, fontWeight: '800', color: g.text },
    storageLimit: { fontSize: 14, fontWeight: '600', color: g.textSecondary },
    pctBadge: {
      backgroundColor: g.accentSoft,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    pctText: { color: g.accent, fontWeight: '800', fontSize: 13 },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: g.glassBorder,
      marginTop: 16,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 4, backgroundColor: g.accent },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },

    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
    actionWrap: { width: '47%', flexGrow: 1 },
    actionBusy: { opacity: 0.5 },
    actionInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionLabel: { fontSize: 14.5, fontWeight: '700', color: g.text },

    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: g.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 10,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowName: { flex: 1, fontSize: 14.5, fontWeight: '600', color: g.text },
    rowMeta: { marginTop: 2, fontSize: 12, color: g.textSecondary },
    empty: { textAlign: 'center', color: g.textSecondary, padding: 24, fontSize: 14 },
  });
}
