// @aufbau/recognizers/index.js

// pointer-driven gesture recognizers. every recognizer is a factory returning
// { handlers, style?, touchAction?, destroy?, set? }: `handlers` maps native event
// names to listeners and nothing binds itself, so the same factory works
// standalone, composed through gestures(), or behind a framework adapter (see
// adapters/). the composer is the only part that touches the dom.

export * from './adjustable.js';
export * from './holdable.js';
export * from './pannable.js';
export * from './pinchable.js';
export * from './pressable.js';
export * from './rotatable.js';
export * from './swipeable.js';
export * from './transformable.js';
export * from './wheelable.js';
