// @aufbau/stylesheet/tokens.js

// @aufbau/packages/stylesheet/src/tokens.js

const DEFAULT_TOKENS = {
  gap: {
    tiny   : '0.25rem',
    small  : '0.50rem',
    normal : '1.00rem',
    big    : '2.00rem',
    huge   : '3.00rem',
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
    category : 'color',
    // Deckt alle Eigenschaften ab, die Einzel-Farben erwarten
    match    : /^(color|background-color|border-color|border-top-color|border-right-color|border-bottom-color|border-left-color|outline-color|fill|stroke)$/   
  }
];

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

/**
 * Extrahiert @aufbau Blöcke und baut das Token-Objekt auf
 */
export function extractTokens(code) {
  const tokens = {
    ...JSON.parse(JSON.stringify(DEFAULT_TOKENS)),
    color: {},
    colors: {}
  };

  let cleanedCode = code;

  // 1. @aufbau color { ... } parsen (Einzel-Farben)
  cleanedCode = cleanedCode.replace(/@aufbau\s+color\s*\{([^}]*)\}/gi, (_, body) => {
    parseBodyLines(body, tokens.color);
    return '';
  });

  // 2. @aufbau colors { ... } parsen (Farbpaare: bg fg)
  cleanedCode = cleanedCode.replace(/@aufbau\s+colors\s*\{([^}]*)\}/gi, (_, body) => {
    const rawPairs = {};
    parseBodyLines(body, rawPairs);

    for (const [key, val] of Object.entries(rawPairs)) {
      const parts = val.trim().split(/\s+/);
      if (parts.length >= 2) {
        // Löst optional vorhandene Namen aus @aufbau color auf (z.B. name2 -> #987654)
        const bg = tokens.color[parts[0]] || parts[0];
        const fg = tokens.color[parts[1]] || parts[1];
        tokens.colors[key] = { bg, fg };
      }
    }
    return '';
  });

  // 3. Alle weiteren Blöcke (@aufbau border, @aufbau padding, etc.)
  cleanedCode = cleanedCode.replace(/@aufbau\s+([a-zA-Z0-9-]+)\s*\{([^}]*)\}/g, (_, category, body) => {
    const catKey = category.trim().toLowerCase();
    if (!tokens[catKey]) tokens[catKey] = {};
    parseBodyLines(body, tokens[catKey]);
    return '';
  });

  return { tokens, code: cleanedCode };
}

/**
 * Wandelt `aufbau-colors: <pair> [inverted];` um
 */
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
      [bg, fg] = [fg, bg]; // Werte tauschen
    }

    return `background-color: ${bg}; color: ${fg};`;
  });
}

/**
 * Löst Einzel-Token-Ersetzungen in CSS-Eigenschaften auf
 */
export function transformTokenProperties(code, tokens) {
  // 1. Zuerst aufbau-colors auflösen
  let result = transformAufbauColors(code, tokens);

  // 2. Normale CSS Properties mit Einzel-Tokens (z.B. background-color: name1;)
  result = result.replace(/([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+);?/g, (fullMatch, prop, rawValue) => {
    const cleanProp = prop.trim();
    const cleanValue = rawValue.trim();

    if (cleanProp.startsWith('aufbau-')) return fullMatch;

    // Passende Kategorie finden (z.B. background-color -> 'color')
    let category = null;
    for (const family of PROPERTY_FAMILY_MAP) {
      if (family.match.test(cleanProp)) {
        category = family.category;
        break;
      }
    }
    if (!category) category = cleanProp;

    const categoryTokens = tokens[category];

    if (categoryTokens && categoryTokens[cleanValue]) {
      return `${cleanProp}: ${categoryTokens[cleanValue]};`;
    }

    return fullMatch;
  });

  return result;
}
