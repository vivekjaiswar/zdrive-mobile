import { useState } from 'react';
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

export default function AudioPlayer({ uri, name }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const [trackWidth, setTrackWidth] = useState(0);
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const duration = status.duration ?? 0;
  const currentTime = status.currentTime ?? 0;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  function togglePlayback() {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    }
  }

  function handleSeek(e: any) {
    if (trackWidth > 0 && duration > 0) {
      const x = e.nativeEvent.locationX;
      const pct = Math.max(0, Math.min(1, x / trackWidth));
      player.seekTo(pct * duration);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.artCircle, status.playing && styles.artCirclePlaying]}>
        <MaterialCommunityIcons name="music" size={44} color={colors.primary} />
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>

      {/* Interactive Apple-Style Audio Slider Scrubber */}
      <Pressable
        style={styles.progressTouchZone}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onPress={handleSeek}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]}>
            <View style={styles.scrubberThumb} />
          </View>
        </View>
      </Pressable>

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

import { fonts } from '@/theme/typography';

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

    artCirclePlaying: {
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      transform: [{ scale: 1.04 }],
    },

    name: {
      fontFamily: fonts.bold,
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 32,
      letterSpacing: -0.2,
    },

    progressTouchZone: {
      width: '100%',
      paddingVertical: 8,
      justifyContent: 'center',
    },

    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.progressBackground,
    },

    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.progressFill,
      position: 'relative',
    },

    scrubberThumb: {
      position: 'absolute',
      right: -6,
      top: -4,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOpacity: 0.25,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },

    timeRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },

    time: {
      fontFamily: fonts.medium,
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

      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },

    playButtonPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.94 }],
    },
  });
}
