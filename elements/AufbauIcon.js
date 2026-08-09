// <aufbau-icon>

import { AufbauElement } from './core/index.js';

const ICONIFY = 'https://api.iconify.design';

/**
 * 'lucide:save' and 'lucide/save' both resolve. collection and name are encoded
 * separately, the colon is part of the iconify path and has to survive.
 */
function iconUrl (icon) {
  const [collection, ...rest] = String(icon).replace('/', ':').split(':');
  const name = rest.join(':');
  if (!collection || !name) return null;
  return `${ICONIFY}/${encodeURIComponent(collection)}:${encodeURIComponent(name)}.svg`;
}

export default class AufbauIcon extends AufbauElement {
  static attr = {
    color : String,
    icon  : String,
    // mask recolours the svg with currentColor and throws its own colours away,
    // image keeps them. multicolour art (flags, logos, emoji) needs image
    mode  : { type: String, default: 'mask', values: ['mask', 'image'] },
    size  : String,
  };

  // the element is a coloured box masked by the icon svg. without these the
  // mask never applies and nothing is ever visible, so it is base styling
  // rather than theming. currentColor makes it inherit text colour.
  static styles = `
    aufbau-icon {
      display: inline-block;
      inline-size: var(--icon-size, 1em);
      block-size: var(--icon-size, 1em);
      background-color: var(--icon-color, currentColor);
      vertical-align: var(--icon-align, -0.125em);
      -webkit-mask-image: var(--icon-url);
      mask-image: var(--icon-url);
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
      -webkit-mask-size: 100% 100%;
      mask-size: 100% 100%;
    }

    aufbau-icon[mode="image"] {
      background-color: transparent;
      background-image: var(--icon-url);
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      -webkit-mask-image: none;
      mask-image: none;
    }

    aufbau-icon:not([icon]) { display: none; }
  `;

  // no markup at all, the element is pure css. everything happens in sync()
  sync () {
    const { icon, size, color } = this.getAttr();
    const url = icon ? iconUrl(icon) : null;

    this.style.setProperty('--icon-url',   url ? `url("${url}")` : '');
    this.style.setProperty('--icon-size',  size  || '');
    this.style.setProperty('--icon-color', color || '');

    if (icon && !url) console.warn(`[aufbau-icon] could not parse icon "${icon}"`);
  }
}

AufbauIcon.init();
