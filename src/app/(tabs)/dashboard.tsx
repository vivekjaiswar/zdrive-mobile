import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import GlassScreen from '@/components/glass/GlassScreen';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StorageCard from '@/components/dashboard/StorageCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import dashboardService, { DashboardStats } from '@/services/dashboard.service';
import usersService from '@/services/users.service';
import { useAuthStore } from '@/store/auth.store';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScroll';
import { UserProfile } from '@/types/user';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tabBarHeight = useTabBarHeight();
  const { uploading, pickAndUpload, pickPhotosAndUpload } = useFileUpload();
  const onScroll = useTabBarScrollHandler();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  async function loadDashboard() {
    try {
      const [statsData, profileData] = await Promise.all([
        dashboardService.getStats(),
        usersService.getProfile().catch(() => null),
      ]);
      setStats(statsData);
      setProfile(profileData);
    } catch (e: any) {
      console.error('Failed to load dashboard stats:', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, []);

  function handleUpload() {
    Alert.alert('Upload', 'Choose a source', [
      {
        text: 'Photos',
        onPress: async () => {
          const result = await pickPhotosAndUpload();
          if (result && result.uploaded.length > 0) loadDashboard();
        },
      },
      {
        text: 'Files',
        onPress: async () => {
          const result = await pickAndUpload();
          if (result && result.uploaded.length > 0) loadDashboard();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const name = profile?.name ?? stats?.userName ?? user?.email.split('@')[0] ?? 'there';
  const avatarUrl = profile?.avatarUrl ?? null;

  return (
    <GlassScreen edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4C8DFF"
          />
        }
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, paddingTop: 8 }}
      >
        {loading && !stats ? (
          <DashboardSkeleton />
        ) : (
          <>
            <DashboardHeader userName={name} avatarUrl={avatarUrl} />

            <StorageCard
              storageUsed={stats?.storageUsed ?? 0}
              storageLimit={stats?.storageLimit ?? 0}
              usagePercentage={stats?.storagePercent ?? 0}
              fileCount={stats?.fileCount ?? 0}
              folderCount={stats?.folderCount ?? 0}
              sharedCount={stats?.sharedFiles ?? 0}
            />

            <QuickActions
              uploading={uploading}
              onUpload={handleUpload}
              fileCount={stats?.fileCount ?? 0}
              sharedCount={stats?.sharedFiles ?? 0}
            />

            <RecentActivity
              files={stats?.recentFiles ?? []}
              folders={stats?.recentFolders ?? []}
              onFilePress={(file) => router.push(`/files/${file.id}`)}
              onFolderPress={(folder) => router.push(`/folders/${folder.id}`)}
            />
          </>
        )}
      </ScrollView>
    </GlassScreen>
  );
}
