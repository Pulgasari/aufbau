// @aufbau/js

// :::::: LOCAL

export * from './CanonicalMap.js';
export * from './coerce.js';
export * from './hash.js';
export * from './log.js';

// dom
export * from './dom/events.js';

// maybe to dingsbums
export * from './number.js';
export * from './object.js';

// maybe to domina
export * from './html.js';

// :::::: VENDORS

// named, not a star: this barrel must stay collision-free, and utils carries
// generic names (hash, lru) that a star export would silently make ambiguous.
export { lazy, lru, memoize } from '@bunker/utils';

export * as dom from '@domina/core';      // https://code.pulgasari.dev/domina/core/index.js
export *        from '@pulgasari/array';  // https://code.pulgasari.dev/js/array.js
export *        from '@pulgasari/is';     // https://code.pulgasari.dev/js/is.js
export *        from '@pulgasari/logger'; // https://code.pulgasari.dev/js/logger.js
export *        from '@pulgasari/str';    // https://code.pulgasari.dev/js/str.js





// minimal escaping — keeps url() valid at roughly two thirds the length.
// single quotes remain in the markup, so results must be wrapped as url("...")
export function encodeSvg (svg) {
  const compact = svg.replace(/\s+/g, ' ').replace(/"/g, "'").trim();
  return `data:image/svg+xml,${compact.replace(/[<>#%{}|\\^`]/g, c => '%' + c.charCodeAt(0).toString(16))}`;
}
