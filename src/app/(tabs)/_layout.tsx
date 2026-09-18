import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGlass } from '@/theme/glass';
import {
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_VERTICAL_PADDING,
} from '@/hooks/useTabBarHeight';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const g = useGlass();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: g.accent,
        tabBarInactiveTintColor: g.textSecondary,
        // Frosted glass tab bar: the bar itself is transparent and a
        // BlurView + translucent overlay renders behind it, so it reads as
        // a frosted strip over the gradient rather than a solid bar.
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={g.blurIntensity + 15}
              tint={g.blurTint}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: g.glassFill,
                  borderTopWidth: 1,
                  borderTopColor: g.glassBorder,
                },
              ]}
            />
          </View>
        ),
        tabBarStyle: {
          height:
            TAB_BAR_CONTENT_HEIGHT + TAB_BAR_VERTICAL_PADDING + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          position: 'absolute',
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '600' },
      }}
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
  );
}
