// @aufbau/js

// the barrel stays collision-free on purpose: bare predicate names (string, even, map, set …)
// are NOT re-exported here, they would clash with the data ops and with each other.
// import them directly when you need them:
//   import { even, filled } from '@aufbau/utils/fp/predicates.js';

export * from './core.js';   // and, compose, constant, curry, identity, not, once, or, pipe, tap
export * from './match.js';  // ifElse, match, unless, when
export * from './is.js';     // is, test, isArray … isZero

export * from './CanonicalMap.js';
export * from './coerce.js';
export * from './hash.js';
export * from './log.js';
export * from './ready.js';

// dom
export * from './dom/events.js';
export * as dom from '@domina/core';

// maybe to bunker
export * from './memo.js';

// maybe to dingsbums
export * from './array.js';
export * from './number.js';
export * from './object.js';
//export * from './random.js';
export * from './string.js';
//export * from './timing.js';
//export * from './url.js';

// maybe to domina
export * from './html.js';



// minimal escaping — keeps url() valid at roughly two thirds the length.
// single quotes remain in the markup, so results must be wrapped as url("...")
export function encodeSvg (svg) {
  const compact = svg.replace(/\s+/g, ' ').replace(/"/g, "'").trim();
  return `data:image/svg+xml,${compact.replace(/[<>#%{}|\\^`]/g, c => '%' + c.charCodeAt(0).toString(16))}`;
}
