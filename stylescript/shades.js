// stylescript/shades.js

/**
 * Lightweight shade engine over native color-mix(). Accepts a token var reference,
 * hex, or color name. Options is either a number (negative -> darken, positive ->
 * lighten) or { alpha | darken | lighten }.
 *
 * The `brand-a20` / `brand-d15` / `brand-l20` string notation is resolved by the
 * controller (Controller.value), which calls this with the base color resolved.
 */
export function shade (color, options = {}) {
  if (typeof options === 'number') {
    options = options < 0 ? { darken: Math.abs(options) } : { lighten: options };
  }

  const { alpha, darken, lighten } = options;

  if (alpha !== undefined) {
    const percentage = typeof alpha === 'number' && alpha <= 1 ? alpha * 100 : alpha;
    return `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
  }
  if (darken !== undefined)  return `color-mix(in srgb, ${color} ${100 - darken}%, black)`;
  if (lighten !== undefined) return `color-mix(in srgb, ${color} ${100 - lighten}%, white)`;

  return color;
}

export default shade;
