import { lightColors } from './palette';

// Kept for screens not yet migrated to useColors() (dark-mode-aware).
// This now points at the refined light palette instead of the old
// blue-tinted one, so every screen gets the visual refresh
// immediately even before its own dedicated pass - it just won't
// react to dark mode until it's migrated to useColors().
const Colors = lightColors;

export default Colors;
