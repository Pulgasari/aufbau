// @aufbau/utils/fp

// the barrel stays collision-free on purpose: bare predicate names (string, even, map, set …)
// are NOT re-exported here, they would clash with the data ops and with each other.
// import them directly when you need them:
//   import { even, filled } from '@aufbau/utils/fp/predicates.js';

export * from './core.js';   // and, compose, constant, curry, identity, not, once, or, pipe, tap
export * from './match.js';  // ifElse, match, unless, when
export * from './is.js';     // is, test, isArray … isZero

export * from './array.js';
export * from './object.js';
export * from './string.js';
