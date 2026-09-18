import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';

import AnimatedTabBar from '@/components/glass/AnimatedTabBar';
import { TabBarVisibility } from '@/hooks/useTabBarScroll';

export default function TabsLayout() {
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
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons
                name={focused ? 'home-variant' : 'home-variant-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="files"
          options={{
            title: 'Files',
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons
                name={focused ? 'folder' : 'folder-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shared"
          options={{
            title: 'Shared',
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons
                name={focused ? 'share-variant' : 'share-variant-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons
                name={focused ? 'cog' : 'cog-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </TabBarVisibility.Provider>
  );
}
