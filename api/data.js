// @aufbau/api/data.js

import { fonts } from '@aufbau/webfonts/data.js';
import { LAYOUTS, LOOKS, MODES, SKINS, THEMES } from './gestalt.js';

const css = {
  layouts : LAYOUTS,
  looks   : LOOKS,
  modes   : MODES,
  skins   : SKINS,
  themes  : THEMES,
};

export         { css, fonts };
export default { css, fonts };
