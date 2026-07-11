import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  storageUsed: string;
  storageLimit: string;
  usagePercentage: number;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  let index = 0;
  let value = bytes;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(2)} ${units[index]}`;
}

export default function StorageCard({
  storageUsed,
  storageLimit,
  usagePercentage,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.smallTitle}>Cloud storage</Text>

          <Text style={styles.bigStorage}>
            {formatBytes(Number(storageLimit))}
          </Text>
        </View>

        <View style={styles.circle}>
          <Text style={styles.circleText}>{usagePercentage}%</Text>
        </View>
      </View>

      <Text style={styles.usedText}>
        {formatBytes(Number(storageUsed))} used
      </Text>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(usagePercentage, 100)}%` },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.bottomLabel}>Available</Text>

        <Text style={styles.bottomValue}>
          {formatBytes(Number(storageLimit) - Number(storageUsed))}
        </Text>
      </View>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 24,

      // Neutral shadow instead of the old brand-colored one - reads
      // less "default template," more like considered elevation.
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },

    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    smallTitle: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 14,
      fontWeight: '500',
    },

    bigStorage: {
      marginTop: 6,
      fontSize: 30,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: '#FFFFFF',
    },

    circle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: 'rgba(255,255,255,0.14)',

      justifyContent: 'center',
      alignItems: 'center',

      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.3)',
    },

    circleText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
    },

    usedText: {
      marginTop: 24,
      color: 'rgba(255,255,255,0.85)',
      fontSize: 14,
    },

    progressBackground: {
      marginTop: 10,
      height: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      overflow: 'hidden',
    },

    progressFill: {
      height: 8,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
    },

    bottomRow: {
      marginTop: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    bottomLabel: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 13,
    },

    bottomValue: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
  });
}
