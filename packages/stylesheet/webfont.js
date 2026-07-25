// Vordefinierte Font-Map
const WEBFONT_MAP = {
  'jetbrains mono': {
    url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
    fallback: 'monospace',
  },
  'inter': {
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
    fallback: 'sans-serif',
  },
  'fira code': {
    url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap',
    fallback: 'monospace',
  },
  'roboto': {
    url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
    fallback: 'sans-serif',
  },
};

/**
 * Sucht `aufbau-webfont: "Font Name";`
 * Gibt den transformierten Code und eine Liste der zu importierenden URLs zurück.
 */
export function transformWebfonts(code) {
  const imports = new Set();

  const transformedCode = code.replace(/aufbau-webfont:\s*["']?([^;"'\n]+)["']?;?/g, (_, fontName) => {
    const cleanName = fontName.trim();
    const fontKey   = cleanName.toLowerCase();
    const config    = WEBFONT_MAP[fontKey];

    if (config) {
      imports.add(config.url);
      return `font-family: "${cleanName}", ${config.fallback};`;
    }

    // Fallback falls der Font nicht in der Map ist
    return `font-family: "${cleanName}", sans-serif;`;
  });

  return { code: transformedCode, imports: Array.from(imports) };
}
