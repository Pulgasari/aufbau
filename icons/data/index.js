// @aufbau/icons/data

// icon-name -> iconify-id lookup maps. the short aufbau names (e.g. 'save',
// 'chevron-down') resolve to full iconify ids (e.g. 'material-symbols:file-save').
// split by domain so a consumer can pull a single group; `icons` merges them all
// into the default lookup that <aufbau-icon> reads.
//
// data only, no logic. resolution + fallback live in the package entry (../index.js).
//
// json import attributes are used elsewhere in the repo (see elements/index.js),
// so they are the established way to pull these tables cross-runtime.

import brands   from './brands.json' with { type: 'json' };
import code     from './code.json'   with { type: 'json' };
import standard from './icons.json'  with { type: 'json' };

// merged default map. keys are unique across the files, so spread order only
// decides the winner on an accidental collision (brands wins last, matching the
// original inline order in elements/AufbauIcon.js).
const icons = { ...standard, ...code, ...brands };

export { brands, code, icons, standard };
export default icons;
