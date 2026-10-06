// @aufbau/svg/aliases.js
// the aufbau default alias list, alias -> icon id. data only, it imports no
// element, so <svg-icon> can load it lazily without a package cycle.

import brands from './data/brands.json' with { type: 'json' };
import code   from './data/code.json'   with { type: 'json' };
import icons  from './data/icons.json'  with { type: 'json' };

export { brands, code, icons };

export default { ...icons, ...code, ...brands };
