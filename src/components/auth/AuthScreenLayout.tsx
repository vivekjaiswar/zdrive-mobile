import { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '@/components/Layout/Screen';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Shared shell for every (auth) screen (login, register, forgot/reset
// password, verify email) so they look consistent instead of each
// re-declaring the same card/logo/scroll boilerplate.
export default function AuthScreenLayout({ title, subtitle, children, footer }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require('../../../assets/logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.form}>{children}</View>

            {footer && <View style={styles.bottom}>{footer}</View>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 40,
    },

    logo: {
      width: 210,
      height: 70,
      alignSelf: 'center',
      marginBottom: 24,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,

      paddingHorizontal: 24,
      paddingVertical: 28,
    },

    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },

    subtitle: {
      marginTop: 10,
      fontSize: 14.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },

    form: {
      marginTop: 28,
      gap: 16,
    },

    bottom: {
      marginTop: 28,
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
  });
}
