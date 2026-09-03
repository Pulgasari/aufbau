// @aufbau/elements/core/skin.js
// the swappable look. every element ships its own structure as `static styles`,
// the skin adds everything decorative on top: tokens, borders, radii, states.
//
// structure lands in @layer aufbau.elements, the skin in aufbau.elements.skin.
// a sub layer sorts after its parent, so the skin wins against structure while
// any unlayered page rule still beats both.

import { adoptStylesheet } from '@domina/methods/adoptStylesheet.js';
import { releaseStylesheet } from '@domina/methods/releaseStylesheet.js';
import { getConfig, onConfigChange, setConfig } from './AufbauConfig.js';
import { ensureLayerOrder, SKIN_LAYER }         from './styles.js';

const CONFIG_KEY   = 'elements-skin';
const DEFAULT_SKIN = 'monochrome';
const SKIN_BASE    = new URL('../../css/skins/', import.meta.url);
const SKIN_KEY     = 'aufbau:skin';

// the default lives in the lowest config layer, so markup and setConfig() both override it without any special casing
setConfig({ [CONFIG_KEY]: DEFAULT_SKIN }, { layer: 'defaults' });

// a bare name resolves against css/skins/, anything that already looks like a path or a url is taken as it is
const skinUrl = (skin) =>
  /^(https?:|\/|\.)/.test(skin) ? new URL(skin, location.href).href
                                : new URL(`${skin}.css`, SKIN_BASE).href;

let current   = undefined;
let listening = false;

// the skin name currently applied, null when switched off
const activeSkin = () => current ?? null;

// adopts the configured skin. idempotent, so every element can call it on connect without caring whether it already ran.
function applySkin (skin = getConfig(CONFIG_KEY, DEFAULT_SKIN)) {
  if (!listening) {
    listening = true;
    onConfigChange(() => applySkin());
  }

  const next = skin === 'none' || skin === 'off' ? null : skin || null;
  if (next === current) return;

  const previous = current;
  current = next;

  ensureLayerOrder();

  // replace keeps the sheet's position in the cascade stable across a switch
  if (next)     return adoptStylesheet(skinUrl(next), { key: SKIN_KEY, layer: SKIN_LAYER, replace: previous != null });
  if (previous) return releaseStylesheet(SKIN_KEY);
}

// switches the skin at runtime. `null`, 'none' and 'off' remove it
function setSkin (skin) {
  setConfig(CONFIG_KEY, skin ?? 'none');
  return applySkin();
}

// :::::: EXPORTS

export {
  CONFIG_KEY as SKIN_CONFIG_KEY,
  DEFAULT_SKIN, 
  SKIN_KEY,
  activeSkin,
  applySkin,
  setSkin,
};

export default applySkin;
