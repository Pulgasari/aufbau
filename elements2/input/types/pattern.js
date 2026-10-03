// a background pattern of @aufbau/patterns: the pattern's id, then what is
// switched on, an opacity and the colors of pattern and background.
//
//   'dots'                      the pattern alone
//   'dots 8%'                   with an opacity
//   'dots 8% #ffffff #202020'   with an opacity and colors
//   ''                          no pattern
//
// attributes: `patterns` (space separated ids, all when absent), `opacity`
// (a slider), `colors` (two color fields), `required` (no swatch for none)

import text from './text.js';

const PERCENT = /^(\d+(?:\.\d+)?)%$/;

// the parts of a value: { id, opacity (0..1 or null), fg, bg }
export function parsePattern (value = '') {
  const tokens = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  const id     = tokens.shift() ?? '';
  const parts  = { bg: null, fg: null, id: id === 'none' ? '' : id, opacity: null };

  for (const token of tokens) {
    const percent = token.match(PERCENT);
    if (percent)        parts.opacity = Math.min(1, Number(percent[1]) / 100);
    else if (!parts.fg) parts.fg = token;
    else if (!parts.bg) parts.bg = token;
  }

  return parts;
}

// a value from its parts, the inverse of parsePattern()
export function formatPattern ({ bg, fg, id, opacity } = {}) {
  if (!id) return '';

  const tokens = [id];
  if (opacity != null) tokens.push(`${Math.round(opacity * 100)}%`);

  // the colors are read by position, a background needs the pattern color before it
  if (bg)      tokens.push(fg ?? '#000000', bg);
  else if (fg) tokens.push(fg);

  return tokens.join(' ');
}

// the custom properties a value paints with, null for no pattern:
// --pattern-image (the tile as url()) and --pattern-opacity. `name` replaces the
// "pattern" in both, for more than one on a page. painted as a mask over a
// color, the pattern takes the color of its place:
//
//   .box::before { background: currentColor; mask: var(--pattern-image); opacity: var(--pattern-opacity); }
export async function patternStyle (value, { name = 'pattern', opacity = 1 } = {}) {
  const parts = parsePattern(value);
  if (!parts.id) return null;

  const colors = {};
  if (parts.fg) colors.fg = parts.fg;
  if (parts.bg) colors.bg = parts.bg;

  try {
    const { use } = await import('@aufbau/patterns');
    const image   = await use(parts.id, colors).image();
    return { [`--${name}-image`]: image, [`--${name}-opacity`]: String(parts.opacity ?? opacity) };
  }
  catch { return null; }
}

export default {
  ...text,
  attributes  : ['colors', 'opacity', 'patterns'],   // required is a control attribute already
  icon        : 'lucide:grid-3x3',
  look        : 'pattern',
};
