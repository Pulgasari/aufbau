// @aufbau/stylesheet/tokens.js

// Built-in Standard-Presets
const DEFAULT_TOKENS = {
  gap: {
    tiny   : '0.25rem',
    small  : '0.50rem',
    normal : '1.00rem',
    big    : '2.00rem',
    huge   : '3.00rem',
  },
};

// Löst einen Token-Wert auf (z.B. category='gap', key='small' -> '0.50rem')
export function resolveToken (tokens, category, key) {
  return tokens[category]?.[key] || key;
}

// Extrahiert @aufbau <category> { ... } Blöcke aus dem Code 
// und gibt ein Objekt mit den gecachten Tokens sowie den bereinigten Code zurück.
export function extractTokens (code) {
  // Deep Clone der Defaults
  const tokens = JSON.parse(JSON.stringify(DEFAULT_TOKENS));

  // Matcht: @aufbau gap { tiny: 0.25rem; ... }
  const cleanedCode = code.replace(/@aufbau\s+(\w+)\s*\{([^}]*)\}/g, (_, category, body) => {
    if (!tokens[category]) tokens[category] = {};

    const lines = body.split('\n');
    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length === 2) {
        const key   = parts[0].trim();
        const value = parts[1].replace(';', '').trim();
        if (key && value) {
          tokens[category][key] = value;
        }
      }
    }
    return ''; // Entfernt den Block aus dem generierten CSS
  });

  return { tokens, code: cleanedCode };
}

// Wandelt `aufbau-gap: huge;` -> `gap: 3.00rem;` um
export function transformTokenProperties (code, tokens) {
  return code.replace(/aufbau-gap:\s*([^;}\n]+);?/g, (_, key) => {
    const val = resolveToken(tokens, 'gap', key.trim());
    return `gap: ${val};`;
  });
}






