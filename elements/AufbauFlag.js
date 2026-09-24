// <aufbau-flag>
// the host is the flag, painted as a background image. no inner <aufbau-icon>:
// a flag is always multicolour art, so the mask path of the icon has nothing to offer.

import { AufbauElement } from './core/index.js';
import { iconUrl }       from './AufbauIcon.js';

// circle-flags ships 1:1 art, flagpack ships 4:3
const VARIANTS = {
  '4x3'  : { ratio: '4 / 3', set: 'flagpack'     },
  circle : { ratio: '1',     set: 'circle-flags' },
  square : { ratio: '4 / 3', set: 'flagpack'     },
};

// region names in the page language, e.g. 'de' -> 'Deutschland'
let regionNames = null;
const regionName = (code) => {
  try {
    regionNames ??= new Intl.DisplayNames([document.documentElement.lang || navigator.language], { type: 'region' });
    return regionNames.of(code.toUpperCase());
  }
  catch { return code.toUpperCase(); }
};

export default class AufbauFlag extends AufbauElement {
  static internals = { role: 'img' };

  static reflect = ['variant'];

  static attr = {
    code    : 'de',
    // an explicit label wins over the region name derived from the code
    label   : String,
    // falls back to <aufbau-config flag-variant="..."> when the attribute is absent
    variant : { type: String, default: 'circle', values: ['circle', 'square', '4x3'], config: true },
  };

  // the variant can come from config, so the ratio is fed through a custom
  // property from sync() rather than selected by attribute
  static styles = `aufbau-flag {
    aspect-ratio   : var(--flag-ratio, 1);
    background     : var(--flag-url, none) center / contain no-repeat;
    display        : inline-block;
    flex           : none;
    inline-size    : var(--flag-size, 1.25em);
    vertical-align : var(--flag-align, -0.15em);
  }`;

  sync () {
    const { code, label, variant } = this.getAttr();
    const { ratio, set } = VARIANTS[variant];
    const region = String(code).toLowerCase();
    const url    = iconUrl(`${set}:${region}`);

    this.style.setProperty('--flag-ratio', ratio);
    this.style.setProperty('--flag-url',   url ? `url("${url}")` : '');

    if (this.internals) this.internals.ariaLabel = label || regionName(region);
  }
}

AufbauFlag.init();
