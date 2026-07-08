import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/theme/colors';
import {
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_VERTICAL_PADDING,
} from '@/hooks/useTabBarHeight';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: Colors.primary,

        tabBarInactiveTintColor: '#94A3B8',

        tabBarStyle: {
          // Height/padding derive from the device's actual bottom
          // safe-area inset instead of a fixed guess, so the bar
          // doesn't crowd (or leave a gap above) the gesture nav
          // bar / home indicator on any given device.
          height:
            TAB_BAR_CONTENT_HEIGHT +
            TAB_BAR_VERTICAL_PADDING +
            insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',

          elevation: 12,

          shadowColor: '#000',

          shadowOpacity: 0.08,

          shadowRadius: 10,

          shadowOffset: {
            width: 0,
            height: -2,
          },
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="folder-outline"
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="share-variant-outline"
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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="cog-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
