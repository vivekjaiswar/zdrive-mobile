import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  loading?: boolean;
  destructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
  // Toggle mode: when provided, a Switch replaces the value/chevron
  // and the row itself is no longer independently pressable (avoids
  // the row's own tap and the Switch's tap firing two toggles at
  // once) - used for the biometric lock row in Settings.
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
}

export default function SettingsRow({
  icon,
  label,
  value,
  onPress,
  loading = false,
  destructive = false,
  showChevron = true,
  isLast = false,
  toggleValue,
  onToggleChange,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const isDark = colors.statusBarStyle === 'light';
  const color = destructive ? colors.danger : colors.primary;
  const isToggle = toggleValue !== undefined;

  return (
    <Pressable
      onPress={isToggle ? undefined : onPress}
      disabled={isToggle || !onPress || loading}
      style={({ pressed }) => [
        styles.row,
        isLast && styles.rowLast,
        pressed && onPress && !isToggle && styles.pressed,
      ]}
    >
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={19} color={color} />
      </View>

      <Text style={[styles.label, destructive && { color: colors.danger }]}>
        {label}
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{
            false: isDark ? 'rgba(255, 255, 255, 0.18)' : '#E5E5EA',
            true: '#34C759',
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={isDark ? 'rgba(255, 255, 255, 0.18)' : '#E5E5EA'}
        />
      ) : value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {!isToggle && onPress && showChevron && !loading && (
        <MaterialCommunityIcons name="chevron-right" size={19} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

import { fonts } from '@/theme/typography';

function getStyles(colors: ColorPalette) {
  const isDark = colors.statusBarStyle === 'light';
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
      gap: 12,
    },
    rowLast: {
      borderBottomWidth: 0,
    },

    pressed: {
      opacity: 0.65,
    },

    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },

    label: {
      flex: 1,
      fontSize: 14.5,
      fontFamily: fonts.semiBold,
      color: colors.text,
      letterSpacing: -0.1,
    },

    value: {
      fontSize: 13.5,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      maxWidth: 140,
    },
  });
}
