// @aufbau/packages/stylesheet/index.js

import { extractTokens, transformTokenProperties } from './tokens.js';
import transformLayouts  from './layout.js';
import transformWebfonts from './webfont.js';

/**
 * Haupt-Transform-Funktion für Aufbau Stylesheet
 * @param {string} code - CSS mit Aufbau Extensions
 * @returns {string} - Sauberes, valides CSS
 */
export default function transform (code) {
  if (!code) return '';

  // 1. Tokens extrahieren & Blöcke entfernen
  const { tokens, code: codeWithoutBlocks } = extractTokens(code);

  // 2. Webfonts verarbeiten & @imports sammeln
  const { code: codeFontTransformed, imports } = transformWebfonts(codeWithoutBlocks);

  // 3. Layouts (flex/grid) transformieren
  let result = transformLayouts(codeFontTransformed, tokens);

  // 4. Standalone Token-Properties umwandeln (z.B. aufbau-gap)
  result = transformTokenProperties(result, tokens);

  // 5. @import Anweisungen ganz oben im Stylesheet einfügen
  if (imports.length > 0) {
    const importStatements = imports.map(url => `@import url("${url}");`).join('\n');
    result = `${importStatements}\n\n${result}`;
  }

  return result;
}

/*

@aufbau gap {
  tiny   : 0.25rem;
  small  : 0.50rem;
  normal : 1.00rem;
  big    : 2.00rem;
  huge   : 3.00rem;
}


*/
