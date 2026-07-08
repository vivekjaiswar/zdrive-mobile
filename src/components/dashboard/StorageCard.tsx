import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/theme/colors';

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
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.smallTitle}>
            Cloud Storage
          </Text>

          <Text style={styles.bigStorage}>
            {formatBytes(Number(storageLimit))}
          </Text>
        </View>

        <View style={styles.circle}>
          <Text style={styles.circleText}>
            {usagePercentage}%
          </Text>
        </View>
      </View>

      <Text style={styles.usedText}>
        {formatBytes(Number(storageUsed))} used
      </Text>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(
                usagePercentage,
                100,
              )}%`,
            },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.bottomLabel}>
          Available
        </Text>

        <Text style={styles.bottomValue}>
          {formatBytes(
            Number(storageLimit) -
              Number(storageUsed),
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    padding: 24,

    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 8,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  smallTitle: {
    color: '#D6E8FF',
    fontSize: 15,
  },

  bigStorage: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  circle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.15)',

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  circleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },

  usedText: {
    marginTop: 28,
    color: '#FFFFFF',
    fontSize: 15,
  },

  progressBackground: {
    marginTop: 12,
    height: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },

  progressFill: {
    height: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  bottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  bottomLabel: {
    color: '#D6E8FF',
    fontSize: 14,
  },

  bottomValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});