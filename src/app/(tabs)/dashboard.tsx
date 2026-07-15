import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import Screen from '@/components/Layout/Screen';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StorageCard from '@/components/dashboard/StorageCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';

import dashboardService, {
  DashboardStats,
} from '@/services/dashboard.service';
import { useAuthStore } from '@/store/auth.store';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';

import { useCallback, useState } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const tabBarHeight = useTabBarHeight();

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  // Refresh on every focus, not just first mount - creating a folder
  // or uploading from the Files tab and coming back here should show
  // up in Recent without a manual pull-to-refresh (this screen has
  // no pull-to-refresh gesture at all, so focus is the only signal).
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, []),
  );

  async function loadDashboard() {
    try {
      const response =
        await dashboardService.getStats();

      setStats(response);
    } catch (e: any) {
      console.error('Failed to load dashboard stats:', e?.message ?? 'Unknown error');
    }
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 24,
        }}
      >
        <DashboardHeader
          username={
            stats?.userName ??
            user?.email.split('@')[0] ??
            'User'
          }
        />

        {stats && (
          <StorageCard
            storageUsed={stats.storageUsed}
            storageLimit={stats.storageLimit}
            usagePercentage={stats.storagePercent}
          />
        )}

        <QuickActions onUploaded={loadDashboard} />

        {stats && (
          <RecentActivity
            files={stats.recentFiles}
            folders={stats.recentFolders}
            onFilePress={(file) => router.push(`/files/${file.id}`)}
            onFolderPress={(folder) => router.push(`/folders/${folder.id}`)}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});
