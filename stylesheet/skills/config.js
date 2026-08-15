// @aufbau/stylesheet/skills/config.js
// [at-rule] @aufbau-config

import { blockEnd, stripComments } from './parse.js';

const BASE_CSS_URL   = 'https://code.pulgasari.dev/aufbau/css/';
const BASE_THEME_URL = BASE_CSS_URL + 'themes/';

const FONT_SELECTOR_ALIASES = {
  default   : 'body',
  body      : 'body',
  monospace : 'code, pre, kbd, samp',
  mono      : 'code, pre, kbd, samp',
  heading   : 'h1, h2, h3, h4, h5, h6',
  headings  : 'h1, h2, h3, h4, h5, h6',
};

function formatCssFileName (name) {
  const clean = name.trim();
  return clean.endsWith('.css') ? clean : `${clean}.css`;
}

function normalizeFontValue (val) {
  const clean = val.trim().replace(/^['"]|['"]$/g, '');
  return `'${clean}'`;
}

function parseConfigBlock (rawBody) {
  const config = {
    charset : null,
    font    : null,
    import  : [],
    theme   : null,
    themes  : []
  };

  // a comment would otherwise become part of the next key, and that declaration
  // would be dropped without a word. stripping here also covers the nested
  // font: { … } block further down
  const body = stripComments(rawBody);

  let i = 0;
  const len = body.length;

  while (i < len) {
    while (i < len && /[\s;]/.test(body[i])) i++;
    if (i >= len) break;

    const colonIdx = body.indexOf(':', i);
    if (colonIdx === -1) break;

    const key = body.slice(i, colonIdx).trim().toLowerCase();
    i = colonIdx + 1;

    while (i < len && /\s/.test(body[i])) i++;
    if (i >= len) break;

    // Verschachtelter Block (z.B. font: { ... })
    if (body[i] === '{') {
      let depth = 1;
      const blockStart = i + 1;
      i++;
      while (i < len && depth > 0) {
             if (body[i] === '{') depth++;
        else if (body[i] === '}') depth--;
        i++;
      }
      const blockContent = body.slice(blockStart, i - 1);

      while (i < len && /[\s;]/.test(body[i])) i++;

      if (key === 'font') {
        const fontObj = {};
        const entries = blockContent.split(';');
        for (const entry of entries) {
          const parts = entry.split(':');
          if (parts.length >= 2) {
            const propKey = parts[0].trim();
            const propVal = parts.slice(1).join(':').trim();
            if (propKey && propVal) {
              fontObj[propKey] = propVal;
            }
          }
        }
        config.font = fontObj;
      }
    } else {
      // Einzelner Wert
      let valEnd = i;
      while (valEnd < len && body[valEnd] !== ';' && body[valEnd] !== '}') {
        valEnd++;
      }
      const val = body.slice(i, valEnd).trim();
      i = valEnd + 1;

      if (key === 'charset') {
        config.charset = val.replace(/['"]/g, '').trim();
      } else if (key === 'font') {
        config.font = val;
      } else if (key === 'theme') {
        config.theme = val.replace(/['"]/g, '').trim();
      } else if (key === 'import') {
        config.import = val.split(',').map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);    
      } else if (key === 'themes') {
        config.themes = val.split(',').map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);
      }
    }
  }

  return config;
}

export function transformConfig (code) {
  if (!code || !code.includes('@aufbau-config')) {
    return { code, imports: [], charset: '', fontRules: [] };
  }

  const configRegex = /@aufbau-config\s*\{/g;
  let match;
  let cleanedCode = code;
  const imports = [];
  const rawImportUrls = [];
  let charsetStr = '';
  const fontRules = [];

  while ((match = configRegex.exec(code)) !== null) {
    const startIdx = match.index;
    const i = blockEnd(code, match.index + match[0].length);

    const fullBlock   = code.slice(startIdx, i);
    const bodyContent = code.slice(startIdx + match[0].length, i - 1);

    cleanedCode = cleanedCode.replace(fullBlock, '');

    const parsed = parseConfigBlock(bodyContent);

    // 1. Charset
    if (parsed.charset) {
      charsetStr = `@charset "${parsed.charset}";`;
    }

    // 2. Import CSS Files
    
    if (parsed.import && parsed.import.length > 0) {
      for (const file of parsed.import) {
        rawImportUrls.push(`${BASE_CSS_URL}${formatCssFileName(file)}`);
      }
    }

    // 3. Themes (Theme kommt als Default-Theme ans Ende)
    let themeList = [...parsed.themes];
    if (parsed.theme) {
      const activeBase = parsed.theme.replace(/\.css$/, '');
      themeList = themeList.filter(t => t.replace(/\.css$/, '') !== activeBase);
      themeList.push(parsed.theme);
    }
    
    for (const theme of themeList) {
      rawImportUrls.push(`${BASE_THEME_URL}${formatCssFileName(theme)}`);
    }

    // 4. Font Webfonts
    if (parsed.font) {
      if (typeof parsed.font === 'string') {
        fontRules.push(`body { aufbau-webfont: ${normalizeFontValue(parsed.font)}; }`);
      } else if (typeof parsed.font === 'object') {
        for (const [key, fontVal] of Object.entries(parsed.font)) {
          const selector = FONT_SELECTOR_ALIASES[key] || key;
          fontRules.push(`${selector} { aufbau-webfont: ${normalizeFontValue(fontVal)}; }`);
        }
      }
    }
  }
  
  return {
    code: cleanedCode,
    imports: rawImportUrls, // Plain URL strings
    charset: charsetStr,
    fontRules
  };
}

export default transformConfig;
