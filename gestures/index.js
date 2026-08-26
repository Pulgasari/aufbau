// @aufbau/gestures
// pointer-driven gestures for the browser. the recognizers and the composer are
// framework-agnostic (core.js); framework bindings live under adapters/ and are
// imported on their own, e.g. `import { useGesture } from '@aufbau/gestures/preact'`.
//
//   import { gestures } from '@aufbau/gestures';
//   const handle = gestures(el, { onSwipeLeft: … , onAdjust: … });
//   // later: handle.destroy();

export {
  // recognizers
  adjustable,
  holdable,
  pannable,
  pressable,
  swipeable,
  // composer
  gestures,
  // math helpers
  clamp,
  distance,
  midpoint,
  snap
} from './core.js';
