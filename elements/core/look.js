// @aufbau/elements/core/look.js
//
// the shorthand shared by <aufbau-index> and <aufbau-item>: a single `look`
// attribute that folds an item size and a shape into one token list, e.g.
// `item-look="200px squircle"`. explicit `item-size` / `item-shape` attributes
// always win over what the shorthand carries.
//
// (the earlier drafts of both elements called a `parseLook()` that was never
// defined anywhere — this is that missing helper, written once and imported by
// both.)

// the named shapes map to a border-radius value; anything else is passed
// through verbatim, so `shape="8px"` or `shape="20% / 40%"` also work.
const SHAPES = {
  circle   : '50%',
  square   : '0px',
  rounded  : '12px',
  squircle : '24% / 50%',
};

/** a named shape -> its border-radius value; a custom value passes through */
export const resolveShape = (shape) => shape ? (SHAPES[shape] ?? shape) : '';

/** true when a token reads as a CSS length/number rather than a shape word */
const isSize = (token) =>
  /^[\d.]/.test(token) || /(px|rem|em|%|vw|vh|vmin|vmax|ch|fr|pt|cm|mm|in)$/.test(token);

/**
 * split a `look` shorthand into `{ size, shape }`. tokens are classified by
 * shape: a length-looking token is the size, anything else is the shape. order
 * does not matter, and either part may be omitted.
 */
export function parseLook (look) {
  const out = { size: '', shape: '' };
  if (!look) return out;
  for (const token of String(look).trim().split(/\s+/)) {
    if (!token) continue;
    if (isSize(token)) out.size = token;
    else               out.shape = token;
  }
  return out;
}
