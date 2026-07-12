import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

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
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });

  return (
    <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
  );
}

const styles = StyleSheet.create({
  video: {
    flex: 1,
  },
});
