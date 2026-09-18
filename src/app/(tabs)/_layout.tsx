import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';

import AnimatedTabBar from '@/components/glass/AnimatedTabBar';
import { TabBarVisibility } from '@/hooks/useTabBarScroll';

export default function TabsLayout() {
  // 1 = tab bar shown, 0 = hidden. Shared with each screen's scroll handler
  // (via TabBarVisibility) so scrolling down hides the bar and up reveals it.
  const tabBarVisible = useSharedValue(1);

  return (
    <TabBarVisibility.Provider value={tabBarVisible}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <AnimatedTabBar {...props} visible={tabBarVisible} />}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="files"
          options={{
            title: 'Files',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="folder-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shared"
          options={{
            title: 'Shared',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="share-variant-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </TabBarVisibility.Provider>
  );
}
