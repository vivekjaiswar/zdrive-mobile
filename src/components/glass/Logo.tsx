import { Image, StyleSheet, Text, View } from 'react-native';

import { useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

interface Props {
  size?: number;
  showTagline?: boolean;
  markOnly?: boolean;
}

export default function Logo({ size = 46, showTagline = true, markOnly = false }: Props) {
  const g = useGlass();

  return (
    <View style={styles.row}>
      <Image
        source={require('../../../assets/images/oji-mark.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />

      {!markOnly && (
        <View style={styles.textCol}>
          <Text style={[styles.word, { fontSize: size * 0.58 }]}>
            <Text style={{ color: g.accent }}>OJI </Text>
            <Text style={{ color: g.text }}>DRIVE</Text>
          </Text>
          {showTagline && (
            <Text
              style={[
                styles.tagline,
                { color: g.textSecondary, fontSize: Math.max(9, Math.round(size * 0.17)) },
              ]}
            >
              COMMUNITY CONVENIENCE
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textCol: { justifyContent: 'center' },
  word: {
    fontFamily: fonts.heading,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: fonts.bold,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
