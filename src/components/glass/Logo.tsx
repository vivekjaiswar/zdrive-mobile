import { Image, StyleSheet, Text, View } from 'react-native';

import { useGlass } from '@/theme/glass';

interface Props {
  // Height of the cloud+Z mark in px; the wordmark scales relative to it.
  size?: number;
  showTagline?: boolean;
  // Icon-only (no wordmark) - for compact headers.
  markOnly?: boolean;
}

// Dynamic ZDrive logo: the cloud+Z mark is a transparent PNG (blue, reads on
// any background), and the "ZDrive" wordmark + tagline are LIVE TEXT coloured
// by theme - so on dark mode "Drive" is light and the tagline is legible,
// instead of the old flattened logo whose baked white box + black text looked
// wrong on a dark screen.
export default function Logo({ size = 46, showTagline = true, markOnly = false }: Props) {
  const g = useGlass();

  return (
    <View style={styles.row}>
      <Image
        source={require('../../../assets/images/logo-mark.png')}
        style={{ width: size * 1.34, height: size }}
        resizeMode="contain"
      />

      {!markOnly && (
        <View style={styles.textCol}>
          <Text style={[styles.word, { fontSize: size * 0.62 }]}>
            <Text style={{ color: g.accent }}>Z</Text>
            <Text style={{ color: g.text }}>Drive</Text>
          </Text>
          {showTagline && (
            <Text
              style={[
                styles.tagline,
                { color: g.textSecondary, fontSize: size * 0.19 },
              ]}
            >
              STORE. ACCESS. ANYWHERE.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textCol: { justifyContent: 'center' },
  word: { fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
});
