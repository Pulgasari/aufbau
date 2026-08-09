// <aufbau-flag>

import { AufbauElement } from './core/index.js';
import { html } from '@aufbau/js';

// circle-flags ships 1:1 art, flagpack ships 4:3
const ICON_SETS = { circle: 'circle-flags', square: 'flagpack', '4x3': 'flagpack' };

export default class AufbauFlag extends AufbauElement {
  static attr = {
    code    : 'de',
    // falls back to <aufbau-config flag-variant="..."> when the attribute is absent
    variant : { type: String, default: 'circle', values: ['circle', 'square', '4x3'], config: true },
  };

  // the inner icon runs in image mode, a mask would flatten the flag into a
  // single coloured silhouette. the variant rides along as a class, so nothing
  // has to be reflected back onto the host
  static styles = `
    aufbau-flag {
      display: inline-block;
      line-height: 0;
      vertical-align: var(--flag-align, -0.15em);
    }

    aufbau-flag > aufbau-icon {
      inline-size: var(--flag-size, 1.25em);
      vertical-align: baseline;
    }

    aufbau-flag > .flag-circle { block-size: var(--flag-size, 1.25em); }

    aufbau-flag > .flag-square,
    aufbau-flag > .flag-4x3 { block-size: calc(var(--flag-size, 1.25em) * 3 / 4); }
  `;

  render () {
    const { code, variant } = this.getAttr();
    const icon = `${ICON_SETS[variant]}:${String(code).toLowerCase()}`;

    return html`<aufbau-icon mode="image" class="flag-${variant}" icon="${icon}"></aufbau-icon>`;
  }
}

AufbauFlag.init();
