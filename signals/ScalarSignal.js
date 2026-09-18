// @aufbau/signals/ScalarSignal.js
// any value, held as it is given. the plain carrier the other types specialise —
// reach for one of those when the value has a shape worth enforcing.

// :::::: IMPORT

import { BaseSignal } from './BaseSignal.js';

// :::::: MAIN

// nothing to override: the value is held exactly as given, which is the whole type.
class ScalarSignal extends BaseSignal {}

const scalarSignal = (...args) => new ScalarSignal (...args);

// :::::: EXPORT

export { ScalarSignal, scalarSignal };
export default ScalarSignal;
