// @aufbau/gestures
// pointer-driven gestures for the browser. the recognizers and the composer are
// framework-agnostic (core.js); framework bindings live under adapters/ and are
// imported on their own, e.g. `import { useGesture } from '@aufbau/gestures/preact'`.
//
//   import { gestures } from '@aufbau/gestures';
//   const handle = gestures(el, { onSwipeLeft: … , onTransform: … });
//   // later: handle.destroy();

export * from './composer.js';
export * from './recognizers/index.js';
export * from './utils.js';

