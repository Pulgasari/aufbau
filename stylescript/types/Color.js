// types/Color.js

import { CssValue, createFactory } from './base.js';

// a color is an opaque value with color-specific operations. it extends CssValue,
// not Num — a color has no amount/unit and no arithmetic.
class ColorInstance extends CssValue {
  constructor (value) {
    super(value);
  }

  // chainable manipulations, all expressed through color-mix so they compose.
  alpha (opacity) {
    const percent = typeof opacity === 'number' && opacity <= 1 ? opacity * 100 : opacity;
    return new ColorInstance(`color-mix(in srgb, ${this.raw} ${percent}%, transparent)`);
  }

  darken (amount) {
    return new ColorInstance(`color-mix(in srgb, ${this.raw} ${100 - amount}%, black)`);
  }

  lighten (amount) {
    return new ColorInstance(`color-mix(in srgb, ${this.raw} ${100 - amount}%, white)`);
  }

  mix (other, amount = 50) {
    return new ColorInstance(`color-mix(in srgb, ${this.raw} ${100 - amount}%, ${other})`);
  }

  toString () {
    return String(this.raw);
  }
}

export const Color = createFactory (ColorInstance, {
  hsl (h, s, l) {
    if (typeof h === 'string' && s === undefined) return new ColorInstance(`hsl(${h})`);
    const saturation = typeof s === 'number' ? `${s}%` : s;
    const lightness  = typeof l === 'number' ? `${l}%` : l;
    return new ColorInstance(`hsl(${h} ${saturation} ${lightness})`);
  },
  rgb   (r, g, b) { return new ColorInstance(`rgb(${r} ${g} ${b})`); },
  oklch (l, c, h) { return new ColorInstance(`oklch(${l} ${c} ${h})`); },
});

export default Color;
