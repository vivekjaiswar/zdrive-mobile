import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  uri: string;
  name: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// expo-audio has no built-in playback UI (unlike expo-video's
// nativeControls), so this builds the minimum viable player: a big
// play/pause button, a static progress bar (no drag-to-seek yet -
// good enough for a v1, same tradeoff ZoomableImage's pan-clamping
// comment already established for this codebase), and elapsed/total
// time.
export default function AudioPlayer({ uri, name }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  function togglePlayback() {
    if (status.playing) {
      player.pause();
    } else {
      // Restart from the beginning once playback has run to the end,
      // rather than leaving the button stuck on "play" at a finished
      // 100% progress bar with nothing happening on tap.
      if (status.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.artCircle}>
        <MaterialCommunityIcons name="music" size={44} color={colors.primary} />
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
        onPress={togglePlayback}
      >
        <MaterialCommunityIcons
          name={status.playing ? 'pause' : 'play'}
          size={32}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },

    artCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 28,
    },

    name: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 32,
    },

    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.progressBackground,
      overflow: 'hidden',
    },

    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.progressFill,
    },

    timeRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },

    time: {
      fontSize: 12.5,
      color: colors.textSecondary,
    },

    playButton: {
      marginTop: 36,
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',

      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },

    playButtonPressed: {
      opacity: 0.9,
    },
  });
}
