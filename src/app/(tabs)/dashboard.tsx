import { ScrollView, StyleSheet } from 'react-native';

import Screen from '@/components/Layout/Screen';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StorageCard from '@/components/dashboard/StorageCard';
import QuickActions from '@/components/dashboard/QuickActions';

import dashboardService, {
  DashboardStats,
} from '@/services/dashboard.service';
import { useAuthStore } from '@/store/auth.store';

import { useEffect, useState } from 'react';

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const response =
        await dashboardService.getStats();

      setStats(response);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <Screen>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});