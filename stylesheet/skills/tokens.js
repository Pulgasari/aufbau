// @aufbau/stylesheet/skills/tokens.js

import { warnMissingToken } from './../dev/debug.js';

// :::::: pre-compiled RegExp rules

const REGEX_LINE_SPLIT     = /\r?\n/;
const REGEX_COLON_SPLIT    = /:(.+)/;
const REGEX_SHADE_PATTERN  = /^([a-zA-Z0-9_-]+)-(d|l|a)(\d+)$/;
const REGEX_AUFBAU_MEDIA   = /@aufbau-media\s+(?:breakpoints\s*)?\{([^}]*)\}/gi;
const REGEX_AUFBAU_COLOR   = /@aufbau\s+color\s*\{([^}]*)\}/gi;
const REGEX_AUFBAU_COLORS  = /@aufbau\s+colors\s*\{([^}]*)\}/gi;
const REGEX_AUFBAU_GENERIC = /@aufbau\s+([a-zA-Z0-9-_,\s]+?)\s*\{([^}]*)\}/g;
const REGEX_DECLARATION    = /([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+);?/g;

// :::::: defaults

const DEFAULT_TOKENS = {
  gap: {
    tiny   : '0.25rem',
    small  : '0.50rem',
    normal : '1.00rem',
    big    : '2.00rem',
    huge   : '3.00rem',
  },
  'aspect-ratio': {
    square   : '1 / 1',
    video    : '16 / 9',
    portrait : '4 / 5',
    cinema   : '21 / 9',
    photo    : '3 / 2',
  },
  media: {
    mobile  : '480px',
    tablet  : '768px',
    desktop : '1024px',
    wide    : '1280px',
  },
  'box-shadow': {
    sm   : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md   : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg   : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl   : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    none : 'none',
  }
};

const PROPERTY_FAMILY_MAP = [
  { category: 'border'        , match: /^border(-top|-right|-bottom|-left|-inline|-block|-inline-start|-inline-end|-block-start|-block-end)?$/ },
  { category: 'padding'       , match: /^padding(-top|-right|-bottom|-left|-inline|-block|-inline-start|-inline-end|-block-start|-block-end)?$/ },
  { category: 'margin'        , match: /^margin(-top|-right|-bottom|-left|-inline|-block|-inline-start|-inline-end|-block-start|-block-end)?$/ },
  { category: 'gap'           , match: /^(gap|row-gap|column-gap)$/ },
  { category: 'border-radius' , match: /^border(-top-left|-top-right|-bottom-left|-bottom-right|-start-start|-start-end|-end-start|-end-end)?-radius$/ },
  { category: 'aspect-ratio'  , match: /^aspect-ratio$/ },
  { category: 'box-shadow'    , match: /^(box-shadow|shadow)$/ },
  { category: 'color'         , match: /^(color|background-color|border-color|border-top-color|border-right-color|border-bottom-color|border-left-color|outline-color|fill|stroke)$/ }
];

export function resolveColorShade(val, colorTokens) {
  if (!colorTokens) return null;
  if (colorTokens[val]) return colorTokens[val];

  const shadeMatch = val.match(REGEX_SHADE_PATTERN);
  if (!shadeMatch) return null;

  const [, baseName, type, pctStr] = shadeMatch;
  const baseColor = colorTokens[baseName];
  if (!baseColor) return null;

  const pct = parseInt(pctStr, 10);
  if (isNaN(pct) || pct < 0 || pct > 100) return null;

  const basePct = 100 - pct;
  if (type === 'd') return `color-mix(in srgb, ${baseColor} ${basePct}%, black)`;
  if (type === 'l') return `color-mix(in srgb, ${baseColor} ${basePct}%, white)`;
  if (type === 'a') return `color-mix(in srgb, ${baseColor} ${pct}%, transparent)`;

  return null;
}

function parseBodyLines(body, targetObj) {
  const lines = body.split(REGEX_LINE_SPLIT);
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(REGEX_COLON_SPLIT);
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts[1].replace(';', '').trim();
      if (key && value) targetObj[key] = value;
    }
  }
}

export function extractTokens(code) {
  const tokens = {
    ...JSON.parse(JSON.stringify(DEFAULT_TOKENS)),
    color: {},
    colors: {}
  };

  let cleanedCode = code
    .replace(REGEX_AUFBAU_MEDIA, (_, body) => { parseBodyLines(body, tokens.media); return ''; })
    .replace(REGEX_AUFBAU_COLOR, (_, body) => { parseBodyLines(body, tokens.color); return ''; })
    .replace(REGEX_AUFBAU_COLORS, (_, body) => {
      const rawPairs = {};
      parseBodyLines(body, rawPairs);
      for (const [key, val] of Object.entries(rawPairs)) {
        const parts = val.trim().split(/\s+/);
        if (parts.length >= 2) {
          const bg = resolveColorShade(parts[0], tokens.color) || parts[0];
          const fg = resolveColorShade(parts[1], tokens.color) || parts[1];
          tokens.colors[key] = { bg, fg };
        }
      }
      return '';
    })
    .replace(REGEX_AUFBAU_GENERIC, (_, categories, body) => {
      const parsed  = {}; parseBodyLines(body, parsed);
      const catKeys = categories.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);

      for (const catKey of catKeys) {
        if (!tokens[catKey]) tokens[catKey] = {};
        Object.assign(tokens[catKey], parsed);
      }

      return '';
    });

  return { tokens, code: cleanedCode };
}

export function transformTokenProperties(code, tokens) {
  return code.replace(REGEX_DECLARATION, (fullMatch, prop, rawValue) => {
    const cleanProp = prop.trim();
    const cleanValue = rawValue.trim();

    if (cleanProp.startsWith('aufbau-')) return fullMatch;

    let category = null;
    for (let i = 0; i < PROPERTY_FAMILY_MAP.length; i++) {
      if (PROPERTY_FAMILY_MAP[i].match.test(cleanProp)) {
        category = PROPERTY_FAMILY_MAP[i].category;
        break;
      }
    }
    if (!category) category = cleanProp;

    const categoryTokens = tokens[category];

    if (categoryTokens) {
      if (categoryTokens[cleanValue]) {
        return `${cleanProp}: ${categoryTokens[cleanValue]};`;
      }
      if (category === 'color') {
        const resolvedShade = resolveColorShade(cleanValue, categoryTokens);
        if (resolvedShade) return `${cleanProp}: ${resolvedShade};`;
      }
      warnMissingToken(cleanProp, cleanValue, categoryTokens);
    }

    return fullMatch;
  });
}

/**
 * Löste einen Token-Namen (z.B. 'small' für 'gap') in den entsprechenden CSS-Wert auf.
 * Falls der Schlüssel nicht im Token-Set existiert (z.B. bei Werten wie '1rem' oder '15px'),
 * wird der übergebene Wert direkt als Fallback zurückgegeben.
 */
export function resolveToken(tokens, category, key) {
  if (!key) return '';
  const categoryTokens = tokens?.[category];
  
  if (categoryTokens && categoryTokens[key] !== undefined) {
    return categoryTokens[key];
  }
  
  return key; // Fallback für direkte Wertangaben wie gap(1rem)
}

