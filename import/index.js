// @aufbau/import

import cache from '@aufbau/cache';

// :::::: HELPERS

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`[@aufbau/import] Error loading "${path}": ${response.status} ${response.statusText}`);
  }
  return response.text();
}

// Helper: Prüft, ob ein Objekt serialisierbar für IndexedDB ist
const isCacheable = (val) => {
  if (!val || typeof val !== 'object') return typeof val !== 'function';
  if (val instanceof Node || val instanceof CSSStyleSheet) return false;
  // exclude modules or objects containing function members
  return !Object.values(val).some(v => typeof v === 'function');
};


function transformCSSResult(cssCode, asOption) {
  if (asOption === 'css') return cssCode;
  if (asOption === 'style') {
    const element = document.createElement('style');
    element.textContent = cssCode;
    return element;
  }
  // Default: 'sheet' (CSSStyleSheet)
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssCode);
  return sheet;
}

// :::::: FORMAT HANDLERS

export async function importCSS (path, options = {}) {
  const text = await fetchText(path);
  return transformCSSResult(text, options.as);
}

export async function importCSV (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const PAPA = (await import('https://esm.sh/papaparse@5.4.1')).default;
  const ext = path.split('.').pop().toLowerCase();

  const config = {
    header: options.as !== 'array', // Default: true (returns objects), false for 'array'
    delimiter: ext === 'tsv' ? '\t' : undefined, // Automatic TSV delimiter detection
    dynamicTyping: true, // Automatically converts numbers/booleans from string
    ...options.csvOptions
  };

  const result = PAPA.parse(text, config);
  return result.data;
}

export async function importHTML (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  if (options.as === 'document') {
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/html');
  }

  if (options.as === 'element') {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div;
  }

  return text; // Default: HTML String
}

export async function importJS (path, options = {}) {
  if (options.as === 'raw') return fetchText(path);
  return import(path);
}

export async function importJSON (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;
  return JSON.parse(text);
}

export async function importJSON5 (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const JSON5 = (await import('https://unpkg.com/json5@2/dist/index.min.mjs')).default;
  return JSON5.parse(text);
}

export async function importJSONC (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const json = text.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m));
  return JSON.parse(json);
}

export async function importJSX (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const { transform } = await import('https://esm.sh/sucrase@3.35.0');
  const jsCode = transform(text, { transforms: ['jsx'] }).code;
  if (options.as === 'code') return jsCode;

  // Convert JS string into temporary blob-url for native browser import
  const blob = new Blob([jsCode], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  const module = await import(blobUrl);
  URL.revokeObjectURL(blobUrl);
  return module;
}

export async function importLESS (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const LESS = (await import('https://esm.sh/less@4.2.0')).default;
  const output = await LESS.render(text);

  return transformCSSResult(output.css, options.as);
}

export async function importMD (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  let html;
  if (options.compiler) {
    // Custom compiler callback
    html = options.compiler(text);
  } else {
    const { marked } = await import('https://esm.sh/marked@11.1.1');
    html = await marked.parse(text);
  }

  if (options.as === 'element') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div;
  }

  return html; // Default: 'html' (String)
}

export async function importSASS (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const SASS = (await import('https://esm.sh/sass@1.70.0')).default;
  const css = SASS.compileString(text, { syntax: 'indented' }).css;

  return transformCSSResult(css, options.as);
}

export async function importSCSS (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const SASS = (await import('https://esm.sh/sass@1.70.0')).default;
  const css = SASS.compileString(text, { syntax: 'scss' }).css;

  return transformCSSResult(css, options.as);
}

export async function importSVG (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  if (options.as === 'element') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    return doc.querySelector('svg') || doc.documentElement;
  }

  return text; // Default: SVG string
}

export async function importText (path, options = {}) {
  return fetchText(path);
}

export async function importTOML (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const { parse } = await import('https://esm.sh/smol-toml@1.1.4');
  return parse(text);
}

export async function importTS (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const { transform } = await import('https://esm.sh/sucrase@3.35.0');
  const isJSX = path.endsWith('x');
  const transforms = isJSX ? ['typescript', 'jsx'] : ['typescript'];
  const jsCode = transform(text, { transforms }).code;
  if (options.as === 'code') return jsCode;

  // Convert JS string into temporary blob-url for native browser import
  const blob = new Blob([jsCode], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  const module = await import(blobUrl);
  URL.revokeObjectURL(blobUrl);
  return module;
}
export const importTSX = importTS;

export async function importWASM (path, options = {}) {
  const response = await fetch(path); // Requires binary data
  if (!response.ok) throw new Error(`[@aufbau/import] Error loading WASM "${path}": ${response.status}`);

  if (options.as === 'buffer') return response.arrayBuffer();
  if (options.as === 'module') return WebAssembly.compileStreaming(response);

  // Default: 'instance' (returns executable JS exports)
  const { instance } = await WebAssembly.instantiateStreaming(response, options.importObject || {});
  return instance.exports;
}

export async function importXML (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  if (options.as === 'document') {
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/xml');
  }

  const { XMLParser } = await import('https://esm.sh/fast-xml-parser@4.3.2');
  const xmlParser = new XMLParser(options.xmlOptions || {});
  const jsObj     = xmlParser.parse(text);

  if (options.as === 'json') return JSON.stringify(jsObj);

  return jsObj; // Default: JS Object
}

export async function importYAML (path, options = {}) {
  const text = await fetchText(path);
  if (options.as === 'raw') return text;

  const YAML = (await import('https://esm.sh/yaml@2.3.4')).default;
  return YAML.parse(text);
}

// :::::: EXTENSION MAP & MAIN ENTRY

const extensionMap = {
  cjs   : importJS,
  css   : importCSS,
  csv   : importCSV,
  htm   : importHTML,
  html  : importHTML,
  js    : importJS,
  json  : importJSON,
  json5 : importJSON5,
  jsonc : importJSONC,
  jsx   : importJSX,
  less  : importLESS,
  md    : importMD,
  mjs   : importJS,
  sass  : importSASS,
  scss  : importSCSS,
  svg   : importSVG,
  text  : importText,
  toml  : importTOML,
  ts    : importTS,
  tsx   : importTSX,
  tsv   : importCSV,
  txt   : importText,
  wasm  : importWASM,
  xml   : importXML,
  yaml  : importYAML,
  yml   : importYAML
};

/**
 * Dynamically import files of various extensions with automatic L1/L2 caching
 * @param {string} path
 * @param {Object} [options]
 * @param {boolean} [options.useCache=true] - Toggle caching behavior
 */
export async function importFile(path, options = {}) {
  const useCache = options.useCache !== false;
  const cacheKey = `import:${path}:${JSON.stringify(options)}`;

  // 1. Try reading from @aufbau/cache
  if (useCache) {
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult !== null) return cachedResult;
  }

  const ext = path.split('.').pop().toLowerCase();
  const handler = extensionMap[ext];
  if (!handler) throw new Error(`[@aufbau/import] The file extension .${ext} is not supported.`);

  const result = await handler(path, options);

  // 2. Cache result if serializable (skip DOM nodes, CSSStyleSheets or functions)
  if (useCache && isCacheable(result)) {
    try       { await cache.set(cacheKey, result); } 
    catch (e) { console.warn(`[@aufbau/import] Could not cache "${path}":`, e); }
  }

  return result;
}

export default importFile;
