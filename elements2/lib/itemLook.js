const SHAPES = {
  circle   : '50%',
  square   : '0px',
  rounded  : '12px',
  squircle : '24% / 50%',
};

export const resolveShape = (shape) => shape ? (SHAPES[shape] ?? shape) : '';

const isSize = (token) =>
  /^[\d.]/.test(token) || /(px|rem|em|%|vw|vh|vmin|vmax|ch|fr|pt|cm|mm|in)$/.test(token);

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
