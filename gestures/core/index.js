// @aufbau/recognizers/index.js

// pointer-driven gesture recognizers. every recognizer is a factory returning
// { handlers, style?, touchAction?, destroy?, set? }: `handlers` maps native event
// names to listeners and nothing binds itself, so the same factory works
// standalone, composed through gestures(), or behind a framework adapter (see
// adapters/). the composer is the only part that touches the dom.

export adjustable    from './adjustable.js';
export holdable      from './holdable.js';
export pannable      from './pannable.js';
export pinchable     from './pinchable.js';
export pressable     from './pressable.js';
export rotatable     from './rotatable.js';
export swipeable     from './swipeable.js';
export transformable from './transformable.js';
export wheelable     from './wheelable.js';
