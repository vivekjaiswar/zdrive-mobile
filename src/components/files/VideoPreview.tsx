import { useEvent } from 'expo';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  uri: string;
}

// Thin wrapper around expo-video - nativeControls gives play/pause,
// scrubbing, fullscreen (enabled by default), and volume for free, so
// there's no custom playback UI to build or maintain here (unlike
// audio, which has no built-in chrome at all - see AudioPlayer.tsx).
//
// Deliberately not requesting Picture-in-Picture: it needs a config
// plugin entry in app.json that also flips on iOS/Android background
// audio modes, which is more permission surface than a simple "view
// this video file" screen warrants.
export default function VideoPreview({ uri }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  // The player fails completely silently by default (no visible
  // feedback at all on a network/format error) unless we listen for
  // statusChange ourselves - surfacing loading/error state here so a
  // broken video doesn't just look like a blank screen.
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  if (status === 'error') {
    console.error('VideoPreview playback error:', error?.message);
  }

  return (
    <View style={styles.wrap}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />

      {status === 'loading' && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {status === 'error' && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>
            Couldn't play this video{error?.message ? `: ${error.message}` : '.'}
          </Text>
        </View>
      )}
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
    },

    video: {
      flex: 1,
    },

    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      paddingHorizontal: 24,
    },

    errorText: {
      color: '#FFFFFF',
      fontSize: 14,
      textAlign: 'center',
    },
  });
}
