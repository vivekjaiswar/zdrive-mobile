import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GlassScreen from '@/components/glass/GlassScreen';
import GlassCard from '@/components/glass/GlassCard';
import Logo from '@/components/glass/Logo';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthScreenLayout({ title, subtitle, children, footer }: Props) {
  const g = useGlass();
  const styles = getStyles(g);

  return (
    <GlassScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Logo size={48} />
          </View>

          <GlassCard padding={24} radius={28}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.form}>{children}</View>

            {footer && <View style={styles.bottom}>{footer}</View>}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassScreen>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
    logoWrap: { alignItems: 'center', marginBottom: 26 },
    title: {
      fontSize: 28,
      fontFamily: fonts.heading,
      color: g.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14.5,
      fontFamily: fonts.medium,
      color: g.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
    form: { marginTop: 24, gap: 15 },
    bottom: {
      marginTop: 24,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
  });
}
