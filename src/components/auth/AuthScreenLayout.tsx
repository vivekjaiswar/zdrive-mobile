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

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

// GLASS REDESIGN: shared shell for register / forgot-password /
// reset-password / verify-email. Rewriting this one component flips all of
// them to the glass look - gradient backdrop, dynamic logo (no white box),
// frosted card - matching the redesigned Login screen.
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
      fontSize: 25,
      fontWeight: '800',
      color: g.text,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14.5,
      color: g.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
    form: { marginTop: 24, gap: 15 },
    bottom: {
      marginTop: 24,
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },
  });
}
