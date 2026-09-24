// @aufbau/icons
// passes the icon elements through and registers the default aliases eagerly,
// so importing this package means aliases resolve without the lazy round trip.

import AufbauFlag from '@aufbau/elements/AufbauFlag.js';
import AufbauIcon from '@aufbau/elements/AufbauIcon.js';
import aliases    from './aliases.js';

AufbauIcon.register(aliases);

export { AufbauFlag, AufbauIcon };
export { iconUrl, resolveIcon } from '@aufbau/elements/AufbauIcon.js';
export { default as aliases, brands, code, icons } from './aliases.js';

export default AufbauIcon;
