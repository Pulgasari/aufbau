// @aufbau/gestures/core.js
// pointer-driven gesture recognizers. every recognizer is a factory returning
// { handlers, style?, touchAction?, destroy?, set? }: `handlers` maps native event
// names to listeners and nothing binds itself, so the same factory works
// standalone, composed through gestures(), or behind a framework adapter (see
// adapters/). the composer is the only part that touches the dom.

// :::::: IMPORT

import { angle, angleDelta, clamp, distance, midpoint, snap } from './../utils.js';

import adjustable    from './adjustable.js';
import holdable      from './holdable.js';
import pannable      from './pannable.js';
import pinchable     from './pinchable.js';
import pressable     from './pressable.js';
import rotatable     from './rotatable.js';
import swipeable     from './swipeable.js';
import transformable from './transformable.js';
import wheelable     from './wheelable.js';


// :::::: RECOGNIZERS

// :::::: COMPOSE



// :::::: EXPORT

export {
  adjustable,
  holdable,
  pannable,
  pinchable,
  pressable,
  rotatable,
  swipeable,
  transformable,
  wheelable,
};
