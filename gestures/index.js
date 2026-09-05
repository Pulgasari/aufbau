/* @aufbau/gestures

pointer-driven gestures for the browser. the recognizers and the composer are
framework-agnostic (core.js); framework bindings live under adapters/ and are
imported on their own, e.g. `import { useGesture } from '@aufbau/gestures/preact'`.

import { gestures } from '@aufbau/gestures';
const handle = gestures(el, { onSwipeLeft: … , onTransform: … });
later: handle.destroy();
*/

export * from './compose.js';
export * from './recognizers/index.js';
export * from './utils.js';



const api = {
  
};


/*
async function loadModule (spec, module) {
  const resolved = vendorsMap[spec] || spec;
  const imported = await import(resolved);
  return module ? imported[module] : (imported.default ?? imported);
}

export * from './adjustable.js';
export * from './holdable.js';
export * from './pannable.js';
export * from './pinchable.js';
export * from './pressable.js';
export * from './rotatable.js';
export * from './swipeable.js';
export * from './transformable.js';
export * from './wheelable.js';

import gesturesAPI from '@aufbau/gestures';
const adjustable = await gesturesAPI.load('adjustable');
const adjustable = await gesturesAPI.apply('adjustable');
*/
