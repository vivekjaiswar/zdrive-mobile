import { ReactNode } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  // Screens that live inside the bottom tab navigator already get an
  // explicit paddingBottom sized to the real tab bar height (see
  // useTabBarHeight) - for those, exclude 'bottom' here so the safe
  // area inset isn't reserved twice (once by this SafeAreaView, once
  // by the content padding).
  edges?: readonly Edge[];
}

export default function Screen({
  children,
  edges = ['top', 'left', 'right', 'bottom'],
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#EEF6FF"
      />

      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF6FF',
  },

  container: {
    flex: 1,
    backgroundColor: '#EEF6FF',
    paddingHorizontal: 24,
  },
});
