// @aufbau/icons
// passes the icon elements through and registers the default aliases eagerly,
// so importing this package means aliases resolve without the lazy round trip.

import SvgFlag from '@aufbau/elements/webcomponents/svg-flag.js';
import SvgIcon from '@aufbau/elements/webcomponents/svg-icon.js';
import aliases from './aliases.js';

SvgIcon.register(aliases);

export { SvgFlag, SvgIcon };
export { iconUrl, resolveIcon } from '@aufbau/elements/webcomponents/svg-icon.js';
export { default as aliases, brands, code, icons } from './aliases.js';

export default SvgIcon;
