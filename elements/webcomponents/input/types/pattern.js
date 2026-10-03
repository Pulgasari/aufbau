import text from './text.js';

const PERCENT = /^(\d+(?:\.\d+)?)%$/;

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

  if (bg)      tokens.push(fg ?? '#000000', bg);
  else if (fg) tokens.push(fg);

  return tokens.join(' ');
}

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
