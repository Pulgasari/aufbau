// @aufbau/icons

// :::::: imports

// importing AufbauIcon.js registers <aufbau-icon> as a side effect
// (AufbauIcon.init() runs on import). the element itself still lives in
// @aufbau/elements; this package owns the icon-name map it resolves against
// and re-exports the class so consumers get element + data from one entry.
import AufbauIcon                        from '@aufbau/elements/AufbauIcon.js';
import { brands, code, icons, standard } from './data/index.js';

// :::::: api

// unresolved / unknown names render this iconify id
const fallback = 'material-symbols:help';

// resolve a short aufbau name to a full iconify id. names already carrying a
// collection (containing ':') pass through untouched, unknown names fall back.
function resolve (name) {
  return !name ? fallback : name.includes(':') ? name : icons[name] ?? fallback;
}

// :::::: exports

export { AufbauIcon, brands, code, fallback, icons, resolve, standard };

export default {
  AufbauIcon,
  brands,
  code,
  fallback,
  icons,
  resolve,
  standard,
};
