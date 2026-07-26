// @aufbau/stylesheet/tokens.js

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
  }
};

const PROPERTY_FAMILY_MAP = [
  {
    category : 'border',
    match    : /^border(-top|-right|-bottom|-left|-inline|-block|-inline-start|-inline-end|-block-start|-block-end)?$/
  },
  {
    category : 'padding',
    match    : /^padding(-top|-right|-bottom|-left|-inline|-block|-inline-start|-inline-end|-block-start|-block-end)?$/
  },
  {
    category : 'margin',
    match    : /^margin(-top|-right|-bottom|-left|-inline|-block|-inline-start|-inline-end|-block-start|-block-end)?$/
  },
  {
    category : 'gap',
    match    : /^(gap|row-gap|column-gap)$/
  },
  {
    category : 'border-radius',
    match    : /^border(-top-left|-top-right|-bottom-left|-bottom-right|-start-start|-start-end|-end-start|-end-end)?-radius$/
  },
  {
    category : 'aspect-ratio',
    match    : /^aspect-ratio$/
  },
  {
    category : 'color',
    match    : /^(color|background-color|border-color|border-top-color|border-right-color|border-bottom-color|border-left-color|outline-color|fill|stroke)$/
  }
];

/**
 * Löst relative Farb-Shades wie brand-d20, brand-l15 oder brand-a50 auf
 */
function resolveColorShade(val, colorTokens) {
  if (!colorTokens) return null;

  // Exakte Farbe vorhanden?
  if (colorTokens[val]) return colorTokens[val];

  // Match Pattern: <colorName>-(d|l|a)<percentage>
  const shadeMatch = val.match(/^([a-zA-Z0-9_-]+)-(d|l|a)(\d+)$/);
  if (!shadeMatch) return null;

  const [, baseName, type, pctStr] = shadeMatch;
  const baseColor = colorTokens[baseName];
  if (!baseColor) return null;

  const pct = parseInt(pctStr, 10);
  if (isNaN(pct) || pct < 0 || pct > 100) return null;

  const basePct = 100 - pct;

  if (type === 'd') {
    // Dunkler (d): Base-Farbe + Schwarz
    return `color-mix(in srgb, ${baseColor} ${basePct}%, black)`;
  } else if (type === 'l') {
    // Heller (l): Base-Farbe + Weiß
    return `color-mix(in srgb, ${baseColor} ${basePct}%, white)`;
  } else if (type === 'a') {
    // Alpha (a): Base-Farbe + Transparent
    return `color-mix(in srgb, ${baseColor} ${pct}%, transparent)`;
  }

  return null;
}

function parseBodyLines(body, targetObj) {
  const lines = body.split('\n');
  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length === 2) {
      const key = parts[0].trim();
      const value = parts[1].replace(';', '').trim();
      if (key && value) {
        targetObj[key] = value;
      }
    }
  }
}

export function extractTokens(code) {
  const tokens = {
    ...JSON.parse(JSON.stringify(DEFAULT_TOKENS)),
    color: {},
    colors: {}
  };

  let cleanedCode = code;

  // @aufbau color
  cleanedCode = cleanedCode.replace(/@aufbau\s+color\s*\{([^}]*)\}/gi, (_, body) => {
    parseBodyLines(body, tokens.color);
    return '';
  });

  // @aufbau colors
  cleanedCode = cleanedCode.replace(/@aufbau\s+colors\s*\{([^}]*)\}/gi, (_, body) => {
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
  });

  // Sonstige @aufbau Blöcke
  cleanedCode = cleanedCode.replace(/@aufbau\s+([a-zA-Z0-9-]+)\s*\{([^}]*)\}/g, (_, category, body) => {
    const catKey = category.trim().toLowerCase();
    if (!tokens[catKey]) tokens[catKey] = {};
    parseBodyLines(body, tokens[catKey]);
    return '';
  });

  return { tokens, code: cleanedCode };
}

export function transformAufbauColors(code, tokens) {
  return code.replace(/aufbau-colors:\s*([^;}\n]+);?/g, (fullMatch, rawVal) => {
    const parts = rawVal.trim().split(/\s+/);
    const pairName = parts[0];
    const isInverted = parts.includes('inverted') || parts.includes('invert');

    const pair = tokens.colors?.[pairName];
    if (!pair) return fullMatch;

    let bg = pair.bg;
    let fg = pair.fg;

    if (isInverted) {
      [bg, fg] = [fg, bg];
    }

    return `background-color: ${bg}; color: ${fg};`;
  });
}

export function transformTokenProperties(code, tokens) {
  let result = transformAufbauColors(code, tokens);

  return result.replace(/([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+);?/g, (fullMatch, prop, rawValue) => {
    const cleanProp = prop.trim();
    const cleanValue = rawValue.trim();

    if (cleanProp.startsWith('aufbau-')) return fullMatch;

    let category = null;
    for (const family of PROPERTY_FAMILY_MAP) {
      if (family.match.test(cleanProp)) {
        category = family.category;
        break;
      }
    }
    if (!category) category = cleanProp;

    const categoryTokens = tokens[category];

    if (categoryTokens) {
      // 1. Direktes Token?
      if (categoryTokens[cleanValue]) {
        return `${cleanProp}: ${categoryTokens[cleanValue]};`;
      }
      // 2. Relative Color Shade? (z.B. brand-d20)
      if (category === 'color') {
        const resolvedShade = resolveColorShade(cleanValue, categoryTokens);
        if (resolvedShade) {
          return `${cleanProp}: ${resolvedShade};`;
        }
      }
    }

    return fullMatch;
  });
}
