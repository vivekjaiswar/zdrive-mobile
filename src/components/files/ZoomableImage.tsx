import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  uri: string;
  // Fires whenever zoomed-in state changes (scale > 1 vs. scale ===
  // 1). Lets a parent screen (e.g. the swipeable file preview)
  // disable its own outer pan gesture while the user is actively
  // zoomed in, so panning around a zoomed photo doesn't get
  // misread as a swipe-to-next-file.
  onZoomChange?: (zoomed: boolean) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

// Pinch-to-zoom + pan-when-zoomed + double-tap image viewer. Built on
// react-native-gesture-handler and react-native-reanimated, both
// already installed and compiled into the app for other reasons (RN
// Screens/Navigation, worklets) - no new native dependency needed.
//
// Known simplification: panning while zoomed in has no edge
// clamping, so it's possible to pan the image fully out of view.
// Good enough for a v1 photo viewer; revisit if it's actually
// annoying in practice.
export default function ZoomableImage({ uri, onZoomChange }: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Real (JS-thread) mirror of "are we zoomed in right now" - this is
  // the actual fix for swipe-to-next/prev not working. A
  // Gesture.Pan() claims the touch stream based on its own
  // activation criteria the moment a drag starts, regardless of what
  // its .onUpdate() callback does - an early-return inside onUpdate
  // does NOT stop the gesture from recognizing/claiming the touch.
  // So without `.enabled()`, this inner pan was silently swallowing
  // every horizontal drag even at scale 1, starving the outer
  // swipe-navigation gesture in files/[id].tsx of any touches at all.
  // Only true `.enabled(zoomed)` releases the touch stream to
  // whatever gesture is above this one when not zoomed.
  const [zoomed, setZoomed] = useState(false);

  function notifyZoomChange(next: boolean) {
    setZoomed(next);
    onZoomChange?.(next);
  }

  function reset() {
    'worklet';
    scale.value = withTiming(MIN_SCALE);
    savedScale.value = MIN_SCALE;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    runOnJS(notifyZoomChange)(false);
  }

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(next, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        reset();
      } else {
        runOnJS(notifyZoomChange)(true);
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(zoomed)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > MIN_SCALE) {
        reset();
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
        runOnJS(notifyZoomChange)(true);
      }
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={150}
        />
      </Animated.View>
    </GestureDetector>
  );
}
