import adoptStylesheet   from '@domina/methods/adoptStylesheet.js';
import releaseStylesheet from '@domina/methods/releaseStylesheet.js';

import { getConfig, onConfigChange, setConfig } from '../base/AufbauConfig.js';
import { ensureLayerOrder, SKIN_LAYER }         from './styles.js';

const CONFIG_KEY   = 'elements-skin';
const DEFAULT_SKIN = 'monochrome';
const SKIN_BASE    = new URL('../../css/skins/', import.meta.url);
const SKIN_KEY     = 'aufbau:skin';

setConfig({ [CONFIG_KEY]: DEFAULT_SKIN }, { layer: 'defaults' });

const skinUrl = (skin) =>
  /^(https?:|\/|\.)/.test(skin) ? new URL(skin, location.href).href
                                : new URL(`${skin}.css`, SKIN_BASE).href;

let current   = undefined;
let listening = false;

// the skin name currently applied, null when switched off
const activeSkin = () => current ?? null;

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

  if (next)     return adoptStylesheet(skinUrl(next), { key: SKIN_KEY, layer: SKIN_LAYER, replace: previous != null });
  if (previous) return releaseStylesheet(SKIN_KEY);
}

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
