import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AuthScreenLayout from '@/components/auth/AuthScreenLayout';
import PrimaryButton from '@/components/Button/PrimaryButton';
import { getAuthStyles } from '@/components/auth/authStyles';
import { useConsentStore } from '@/store/consent.store';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

// Shown exactly once per install, before the user ever sees login or
// register - gated by useConsentStore (persisted in SecureStore, see
// src/app/index.tsx for the redirect logic). An already-logged-in
// user (existing session restored from a prior install) never sees
// this screen at all.
export default function ConsentScreen() {
  const router = useRouter();
  const colors = useColors();
  const authStyles = getAuthStyles(colors);
  const styles = getStyles(colors);

  const accept = useConsentStore((state) => state.accept);
  const [agreed, setAgreed] = useState(false);
  const [continuing, setContinuing] = useState(false);

  async function handleContinue() {
    if (!agreed || continuing) return;

    setContinuing(true);
    await accept();
    router.replace('/(auth)/login');
  }

  return (
    <AuthScreenLayout
      title="Welcome to ZDrive"
      subtitle="Secure cloud storage for your files, from ZennialHub."
    >
      <Pressable
        style={styles.checkboxRow}
        onPress={() => setAgreed((prev) => !prev)}
        hitSlop={8}
      >
        <MaterialCommunityIcons
          name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={agreed ? colors.primary : colors.textSecondary}
        />

        <Text style={styles.checkboxText}>
          I have read and agree to the{' '}
          <Text
            style={authStyles.legalLink}
            onPress={(e) => {
              e.stopPropagation();
              router.push('/legal/terms');
            }}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={authStyles.legalLink}
            onPress={(e) => {
              e.stopPropagation();
              router.push('/legal/privacy');
            }}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </Pressable>

      <PrimaryButton
        title="Continue"
        disabled={!agreed}
        loading={continuing}
        onPress={handleContinue}
      />
    </AuthScreenLayout>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },

    checkboxText: {
      flex: 1,
      fontSize: 14.5,
      lineHeight: 21,
      color: colors.text,
    },
  });
}
