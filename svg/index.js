// @aufbau/svg
// passes the svg elements through and registers the default aliases eagerly,
// so importing this package means aliases resolve without the lazy round trip.
// the files: icons/ (<svg-icon icon="aufbau:…">), logos/ (<svg-logo>),
// filters/ and patterns/ (generated, see .github/scripts/generate-assets.mjs).

import SvgFlag from '@aufbau/elements/webcomponents/svg-flag.js';
import SvgIcon from '@aufbau/elements/webcomponents/svg-icon.js';
import SvgLogo from '@aufbau/elements/webcomponents/svg-logo.js';
import aliases from './aliases.js';

SvgIcon.register(aliases);

export { SvgFlag, SvgIcon, SvgLogo };
export { iconUrl, localUrl, resolveIcon } from '@aufbau/elements/webcomponents/svg-icon.js';
export { default as aliases, brands, code, icons } from './aliases.js';

export default SvgIcon;
