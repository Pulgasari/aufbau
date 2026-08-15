// stylescript/shade.js

/**
 * Lightweight Shade Engine using native modern CSS color-mix().
 * 
 * @param {string} color - Token var reference, hex, or color name
 * @param {Object|number} options - Lighten/darken percentage or alpha value
 * @returns {string} Native CSS color-mix() expression
 */
export function shade(color, options = {}) {
  // Shorthand handling: shade('brand', -15) -> darken by 15%
  if (typeof options === 'number') {
    options = options < 0 
      ? { darken: Math.abs(options) } 
      : { lighten: options };
  }

  const { darken, lighten, alpha } = options;

  // 1. Alpha Transparency (e.g. brand-a20)
  if (alpha !== undefined) {
    const percentage = typeof alpha === 'number' && alpha <= 1 ? alpha * 100 : alpha;
    return `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
  }

  // 2. Darken (e.g. brand-d15)
  if (darken !== undefined) {
    const amount = 100 - darken;
    return `color-mix(in srgb, ${color} ${amount}%, black)`;
  }

  // 3. Lighten (e.g. brand-l20)
  if (lighten !== undefined) {
    const amount = 100 - lighten;
    return `color-mix(in srgb, ${color} ${amount}%, white)`;
  }

  return color;
}

/**
 * String notation parser helper for your @aufbau scratchpad syntax (e.g., 'brand-a20', 'brand-d15').
 */
export function parseAufbauShade(tokenString, tokenTree) {
  const match = tokenString.match(/^([a-zA-Z0-9_-]+)-(a|d|l)(\d+)$/);
  if (!match) return tokenString;

  const [, tokenName, type, amountNum] = match;
  const amount = parseInt(amountNum, 10);
  const colorRef = tokenTree.colors?.[tokenName] || `var(--colors-${tokenName})`;

  if (type === 'a') return shade(colorRef, { alpha: amount / 100 });
  if (type === 'd') return shade(colorRef, { darken: amount });
  if (type === 'l') return shade(colorRef, { lighten: amount });

  return tokenString;
}
