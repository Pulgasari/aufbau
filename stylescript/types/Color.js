// types/Color.js

import { CssValue, createFactory } from './base.js';

class ColorInstance extends CssValue {
  constructor(value) {
    super();
    this.raw = value;
  }

  // Chainable color manipulations
  alpha(opacity) {
    const pct = typeof opacity === 'number' && opacity <= 1 ? opacity * 100 : opacity;
    return new ColorInstance(`color-mix(in srgb, ${this.raw}${pct}%, transparent)`);
  }

  darken(amount) {
    return new ColorInstance(`color-mix(in srgb, ${this.raw}${100 - amount}%, black)`);
  }

  toString() {
    return String(this.raw);
  }
}

// Export dual-purpose Color factory & type
export const Color = createFactory (ColorInstance, {
  hsl (h,s,l) {
    if (typeof h === 'string' && s === undefined) {
      return new ColorInstance(`hsl(${h})`);
    }
    const sVal = typeof s === 'number' ? `${s}%` : s;
    const lVal = typeof l === 'number' ? `${l}%` : l;
    return new ColorInstance(`hsl(${h} ${sVal}${lVal})`);
  },
  rgb (r,g,b) {
    return new ColorInstance(`rgb(${r} ${g}${b})`);
  },
  oklch (l,c,h) {
    return new ColorInstance(`oklch(${l} ${c}${h})`);
  }
});
