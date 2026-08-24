// @aufbau/import
// @ts-self-types="./index.d.ts"
// 21.8 kb

// :::::: HELPERS

const isFn     = v => typeof v === 'function';
const isString = v => typeof v === 'string';

const createElement = (tag = 'div', obj = {}) => Object.assign(document.createElement(tag), obj);
const unquote = (value) => value.replace(/^(['"])(.*)\1$/, '$2');

const domFromString = (code, mimeType) => new DOMParser().parseFromString(code, mimeType);

// :::::: CACHE :::::::::::::::::::::::::::::::::::::::::::::::::::

import { BunkerDB, createDb } from 'https://code.pulgasari.dev/bunker/db/index.js';
import { createPolicy }       from 'https://code.pulgasari.dev/bunker/policy/index.js';

const namespace = 'aufbau';
const version   = 1;
const onError   = ({ error, key, operation }) => console.warn(`could not ${operation} "${key}":`, error);
const driver    = BunkerDB.isSupported() ? createDb(namespace).driver('kv') : undefined; // if idb not supported -> fallback to in-memory L1       
const cache     = createPolicy({ driver, onError, max: 256, maxEntries: 512, namespace, version });
const CACHE_VERSION = 2; // bumped whenever the key layout changes, so stale entries fall out on their own

// checks whether a value can be serialized for indexeddb storage
function isCacheable (value) {
  if (!value || typeof value !== 'object') return typeof value !== 'function';
  if (typeof Node !== 'undefined' && value instanceof Node) return false;
  if (typeof CSSStyleSheet !== 'undefined' && value instanceof CSSStyleSheet) return false;
  // exclude module namespaces or objects carrying function members
  return !Object.values(value).some(member => typeof member === 'function');
}

// :::::: VENDOR RESOLUTION ::::::::::::::::::::::::::::::::::::::

const registry = {
  fastXmlParser : 'fast-xml-parser@4.3.2',
  json5         : 'json5@2.2.3',
  less          : 'less@4.2.0',
  marked        : 'marked@11.1.1',
  papaparse     : 'papaparse@5.4.1',
  sass          : 'sass@1.70.0',
  smolToml      : 'smol-toml@1.1.4',
  sucrase       : 'sucrase@3.35.0',
  svgjs         : '@svgdotjs/svg.js@3.2.0',
  yaml          : 'yaml@2.3.4'
};

let cdn = 'https://esm.sh/';
let defaultTTL = 7 * 24 * 60 * 60 * 1000; // one week

const overrides = new Map;
const resolved  = new Map;

// strips the version suffix, scope-safe: '@scope/pkg@1.0.0' -> '@scope/pkg'
function bare (specifier) {
  const at = specifier.lastIndexOf('@');
  return at > 0 ? specifier.slice(0, at) : specifier;
}

export function configure ({ cdn: url, modules, ttl } = {}) {
  if (url) cdn = url.endsWith('/') ? url : url + '/';
  if (ttl !== undefined) defaultTTL = ttl;
  if (modules) for (const [name, value] of Object.entries(modules)) overrides.set(name, value);
}

// resolution order: explicit override -> host importmap / node_modules -> cdn fallback.
// the specifier is assembled at runtime so static analysis (jsr publish, bundlers)
// never sees a literal http url.
function locate (name) {
  const override = overrides.get(name);
  if (isString(override)) return override;

  const specifier = registry[name];
  if (!specifier) throw new Error(`[@aufbau/import] no vendor registered under "${name}".`);

  try {
    const hit = import.meta.resolve(bare(specifier));
    if (hit) return hit;
  }
  catch {} // not present in the importmap or resolver, fall through to cdn

  return cdn + specifier;
}

// resolves a vendor module once per session
function vendor (name) {
  if (resolved.has(name)) return resolved.get(name);

  const override = overrides.get(name);
  const promise  = (override && typeof override === 'object')
    ? Promise.resolve(override)
    : import(/* @vite-ignore */ locate(name));

  resolved.set(name, promise);
  return promise;
}

// :::::: OUTPUT MODES ::::::::::::::::::::::::::::::::::::::::::

// key = canonical mode, value = accepted aliases. the first key is the default.
// only strings are listed here: referencing globals like CSSStyleSheet at module
// load would throw in deno, node or a worker without dom.

const cssModes = {
  stylesheet   : ['sheet', 'cssstylesheet', 'adopted'],
  styleElement : ['style', 'tag', 'htmlstyleelement'],
  raw          : ['code', 'css', 'string', 'text', 'source']
};

const dataModes = {
  value : ['object', 'parsed', 'json', 'js'],
  raw   : ['string', 'text', 'source']
};

const moduleModes = {
  module : ['exports', 'namespace'],
  raw    : ['code', 'source', 'string', 'text']
};

const transpileModes = {
  module : ['exports', 'namespace'],
  code   : ['js', 'javascript', 'compiled'],
  raw    : ['source', 'string', 'text']
};

const textModes = {
  raw : ['code', 'source', 'string', 'text']
};

const outputs = {
  css   : cssModes,
  csv   : {
    records : ['object', 'objects', 'rows', 'json'],
    array   : ['arrays', 'matrix', 'tuples'],
    raw     : ['source', 'string', 'text']
  },
  env   : dataModes,
  html  : {
    string   : ['html', 'markup', 'raw', 'source', 'text'],
    document : ['doc', 'dom'],
    element  : ['div', 'documentfragment', 'fragment', 'node']
  },
  ini   : dataModes,
  js    : moduleModes,
  json  : dataModes,
  json5 : dataModes,
  jsonc : dataModes,
  jsonl : { records  : ['array', 'arrays', 'objects', 'rows'],
            raw      : ['source', 'string', 'text'] },
  jsx   : transpileModes,
  less  : cssModes,
  md    : { html     : ['markup', 'string'],
            element  : ['dom', 'fragment', 'node'],
            raw      : ['markdown', 'source', 'text'] },
  sass  : cssModes,
  scss  : cssModes,
  svg   : { string   : ['markup', 'text'],
            element  : ['dom', 'node', 'svgelement'],
            svgjs    : ['svgdotjs', 'wrapped'],
            raw      : ['original', 'source'] },
  text  : textModes,
  toml  : dataModes,
  ts    : transpileModes,
  wasm  : { instance : ['exports', 'webassemblyinstance'],
            module   : ['compiled', 'webassemblymodule'],
            buffer   : ['arraybuffer', 'binary', 'bytes', 'raw'] },
  xml   : { object   : ['js', 'parsed', 'value'],
            json     : ['jsonstring', 'stringify'],
            document : ['doc', 'dom'],
            raw      : ['source', 'string', 'text', 'xml'] },
  yaml  : dataModes
};

// flattens { canonical: [aliases] } into an o(1) lookup, done once at load
function buildModeIndex (spec) {
  const lookup = new Map;
  for (const [canonical, aliases] of Object.entries(spec)) {
    lookup.set(canonical.toLowerCase(), canonical);
    for (const alias of aliases) lookup.set(alias.toLowerCase(), canonical);
  }
  return { lookup, fallback: Object.keys(spec)[0], list: Object.keys(spec) };
}

const modeIndex = {};
for (const [format, spec] of Object.entries(outputs)) modeIndex[format] = buildModeIndex(spec);

// accepts strings and native constructors alike
const token = (as) => (isFn(as) ? as.name : String(as)).toLowerCase();

export function resolveMode (format, options = {}) {
  const index = modeIndex[format];
  if (!index) return null;

  const as = (isString(options) || isFn(options)) ? options : options.as;
  if (as == null) return index.fallback;

  const canonical = index.lookup.get(token(as));
  if (!canonical) {
    const label = isFn(as) ? as.name : as;
    throw new TypeError(`[@aufbau/import] unknown mode "${label}" for .${format} — expected one of: ${index.list.join(', ')}`);
  }
  return canonical;
}

// :::::: HELPERS :::::::::::::::::::::::::::::::::::::::::::::::

// normalizes the shorthand forms importFile(path, 'raw') and importFile(path, String)
function toOptions (input) {
  if (input == null) return {};
  if (isString(input) || isFn(input)) return { as: input };
  return input;
}

async function fetchText (path, options = {}) {
  const response = await fetch(path, options.fetchOptions);
  if (!response.ok) throw new Error(`[@aufbau/import] error loading "${path}": ${response.status} ${response.statusText}`);
  return response.text();
}

// stable option fingerprint. keys are sorted so property order never changes the
// result. returns null when an option cannot be represented, which disables caching
// instead of silently colliding with a differently configured call.
// control options steer caching itself and must not alter the identity of the
// cached result, otherwise changing a ttl would silently orphan every entry.
const CONTROL_OPTIONS = new Set(['ttl', 'useCache']);

function serializeOptions (options) {
  let out = '';
  for (const key of Object.keys(options).sort()) {
    const value = options[key];
    if (value === undefined || CONTROL_OPTIONS.has(key)) continue;
    if (typeof value === 'function') return null;
    if (typeof value === 'object' && value !== null) {
      try   { out += `${key}=${JSON.stringify(value)};`; }
      catch { return null; }
    } else {
      out += `${key}=${value};`;
    }
  }
  return out;
}

function transformCSSResult (code, mode) {
  if (mode === 'raw')          return code;
  if (mode === 'styleElement') return createElement('style', { textContent: code });
  
  const sheet = new CSSStyleSheet;
  sheet.replaceSync(code);
  return sheet;
}

// :::::: FORMAT HANDLERS :::::::::::::::::::::::::::::::::::::::

export async function importCSS (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  return transformCSSResult(text, resolveMode('css', options));
}

export async function importCSV (path, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('csv', options);
  const text = await fetchText(path, options);
  if (mode === 'raw') return text;

  const PAPA      = (await vendor('papaparse')).default;
  const extension = extensionOf(path);

  return PAPA.parse(text, {
    header        : mode === 'records',
    delimiter     : extension === 'tsv' ? '\t' : undefined,
    dynamicTyping : true,
    ...options.parserOptions
  }).data;
}

export async function importENV (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  if (resolveMode('env', options) === 'raw') return text;

  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^export\s+/, '');
    if (!trimmed || trimmed.startsWith('#')) continue;

    const split = trimmed.indexOf('=');
    if (split === -1) continue;

    result[trimmed.slice(0, split).trim()] = unquote(trimmed.slice(split + 1).trim());
  }
  return result;
}

export async function importHTML (path, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('html', options);
  const text = await fetchText(path, options);

  if (mode === 'document') return new DOMParser().parseFromString(text, 'text/html');
  if (mode === 'element')  return createElement('div', { innerHTML: text });

  return text;
}

export async function importINI (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  if (resolveMode('ini', options) === 'raw') return text;

  const result  = {};
  let   section = result;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;

    const header = trimmed.match(/^\[(.+)\]$/);
    if (header) { section = result[header[1].trim()] ??= {}; continue; }

    const split = trimmed.indexOf('=');
    if (split === -1) continue;

    section[trimmed.slice(0, split).trim()] = unquote(trimmed.slice(split + 1).trim());
  }
  return result;
}

export async function importJS (path, options = {}) {
  options = toOptions(options);
  if (resolveMode('js', options) === 'raw') return fetchText(path, options);
  return import(/* @vite-ignore */ path);
}

export async function importJSON (path, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('json', options);
  const text = await fetchText(path, options);
  if (mode === 'raw') return text;
  return JSON.parse(text);
}

export async function importJSON5 (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  if (resolveMode('json5', options) === 'raw') return text;

  const JSON5 = (await vendor('json5')).default;
  return JSON5.parse(text);
}

export async function importJSONC (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  if (resolveMode('jsonc', options) === 'raw') return text;

  // strips comments while leaving string literals and escaped quotes intact
  const stripped = text.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (match, comment) => (comment ? '' : match));
  return JSON.parse(stripped);
}

export async function importJSONL (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  if (resolveMode('jsonl', options) === 'raw') return text;

  const records = [];
  for (const line of text.split('\n')) {
    if (line.trim()) records.push(JSON.parse(line));
  }
  return records;
}

export async function importJSX (path, options = {}) {
  return transpile(path, 'jsx', toOptions(options));
}

export async function importLESS (path, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('less', options);
  const text = await fetchText(path, options);
  if (mode === 'raw') return text;

  const css = options.compiler
    ? await options.compiler(text, path)
    : (await (await vendor('less')).default.render(text)).css;

  return transformCSSResult(css, mode);
}

/**
 * markdown source string -> html. split out of importMD so callers that already
 * hold the text go through the same configured compiler instead of pulling in a
 * second markdown parser of their own.
 */
export async function renderMD (text, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('md', options);
  if (mode === 'raw') return text;

  const html = options.compiler
    ? await options.compiler(text, options.path)
    : await (await vendor('marked')).marked.parse(text);

  if (mode === 'element') return createElement('div', { innerHTML: html });
  return html;
}

export async function importMD (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  return renderMD(text, { ...options, path });
}

export async function importSASS (path, options = {}) {
  return compileSass(path, 'sass', 'indented', toOptions(options));
}

export async function importSCSS (path, options = {}) {
  return compileSass(path, 'scss', 'scss', toOptions(options));
}

export async function importSVG (path, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('svg', options);
  const text = await fetchText(path, options);
  if (mode === 'raw') return text;

  // strip xml declaration and doctype headers for clean html5 inlining
  const clean = text.replace(/<\?xml[\s\S]*?\?>/gi, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').trim();
  if (mode === 'string') return clean;

  const doc     = new DOMParser().parseFromString(clean, 'image/svg+xml');
  const element = doc.querySelector('svg') || doc.documentElement;
  if (mode === 'element') return element;

  const { SVG } = await vendor('svgjs');
  return SVG(element); // adopts the live node, no re-parse
}

export async function importText (path, options = {}) {
  return fetchText(path, toOptions(options));
}

export async function importTOML (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  if (resolveMode('toml', options) === 'raw') return text;

  const { parse } = await vendor('smolToml');
  return parse(text);
}

export async function importTS (path, options = {}) {
  return transpile(path, 'ts', toOptions(options));
}

export const importTSX = importTS;

export async function importWASM (path, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('wasm', options);

  const response = await fetch(path, options.fetchOptions);
  if (!response.ok) throw new Error(`[@aufbau/import] error loading wasm "${path}": ${response.status} ${response.statusText}`);

  if (mode === 'buffer') return response.arrayBuffer();
  if (mode === 'module') return WebAssembly.compileStreaming(response);

  const { instance } = await WebAssembly.instantiateStreaming(response, options.importObject || {});
  return instance.exports;
}

export async function importXML (path, options = {}) {
  options = toOptions(options);
  const mode = resolveMode('xml', options);
  const text = await fetchText(path, options);

  if (mode === 'raw')      return text;
  if (mode === 'document') return new DOMParser().parseFromString(text, 'text/xml');

  const { XMLParser } = await vendor('fastXmlParser');
  const parsed = new XMLParser(options.parserOptions || {}).parse(text);

  return mode === 'json' ? JSON.stringify(parsed) : parsed;
}

export async function importYAML (path, options = {}) {
  options = toOptions(options);
  const text = await fetchText(path, options);
  if (resolveMode('yaml', options) === 'raw') return text;

  const YAML = (await vendor('yaml')).default;
  return YAML.parse(text);
}

// :::::: SHARED IMPLEMENTATIONS ::::::::::::::::::::::::::::::::

async function compileSass (path, format, syntax, options) {
  const mode = resolveMode(format, options);
  const text = await fetchText(path, options);
  if (mode === 'raw') return text;

  const css = options.compiler
    ? await options.compiler(text, path)
    : (await vendor('sass')).default.compileString(text, { syntax }).css;

  return transformCSSResult(css, mode);
}

async function transpile (path, format, options) {
  const mode = resolveMode(format, options);
  const text = await fetchText(path, options);
  if (mode === 'raw') return text;

  let code;
  if (options.compiler) {
    code = await options.compiler(text, path);
  } else {
    const { transform } = await vendor('sucrase');
    const transforms = format === 'jsx'
      ? ['jsx']
      : (path.endsWith('x') ? ['typescript', 'jsx'] : ['typescript']);
    code = transform(text, { transforms }).code;
  }

  if (mode === 'code') return code;

  // convert the js string into a temporary blob url for native browser import
  const blobUrl = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
  try       { return await import(/* @vite-ignore */ blobUrl); }
  finally   { URL.revokeObjectURL(blobUrl); }
}

// :::::: EXTENSION MAP :::::::::::::::::::::::::::::::::::::::::

const extensionMap = {
  cjs    : importJS,
  css    : importCSS,
  csv    : importCSV,
  env    : importENV,
  frag   : importText,
  glsl   : importText,
  htm    : importHTML,
  html   : importHTML,
  ini    : importINI,
  js     : importJS,
  json   : importJSON,
  json5  : importJSON5,
  jsonc  : importJSONC,
  jsonl  : importJSONL,
  jsx    : importJSX,
  less   : importLESS,
  md     : importMD,
  mjs    : importJS,
  ndjson : importJSONL,
  sass   : importSASS,
  scss   : importSCSS,
  svg    : importSVG,
  text   : importText,
  toml   : importTOML,
  ts     : importTS,
  tsv    : importCSV,
  tsx    : importTSX,
  txt    : importText,
  vert   : importText,
  wasm   : importWASM,
  wgsl   : importText,
  xml    : importXML,
  yaml   : importYAML,
  yml    : importYAML
};

// registers a userland format. modes is optional and takes the same
// { canonical: [aliases] } shape as the built-in output tables.
export function register (extension, handler, modes) {
  const key = extension.toLowerCase().replace(/^\./, '');
  extensionMap[key] = handler;
  if (modes) modeIndex[key] = buildModeIndex(modes);
  return key;
}

// :::::: MAIN ENTRY ::::::::::::::::::::::::::::::::::::::::::::

// splits off query and hash before reading the extension, so cache-busted
// urls like '/data.csv?v=2' still resolve to the csv handler
function extensionOf (path) {
  const url = isString(path) ? path : (path?.href ?? String(path));
  return url.split(/[?#]/)[0].split('.').pop().toLowerCase();
}




/**
 * a relative path is not an identity. the cache is shared per origin, so two
 * pages in different directories importing '../readme.md' would otherwise hit
 * the same entry and get each other's file.
 */
function cacheIdentity (path) {
  if (typeof document === 'undefined') return path;
  try   { return new URL(path, document.baseURI).href; }
  catch { return path; }
}

export async function importFile (path, options) {
  options = toOptions(options);

  const extension = extensionOf(path);
  const handler   = extensionMap[extension];
  if (!handler) throw new Error(`[@aufbau/import] the file extension .${extension} is not supported.`);

  // key layout: import:v<version>:<resource>:<query>:<fingerprint>
  // the resource segment is the absolute url and query-free, so every
  // cache-busted variant of one file shares a prefix and can be swept together.
  const [resource, query = ''] = cacheIdentity(path).split(/[?#]/);
  const fingerprint = serializeOptions(options);
  const useCache    = options.useCache !== false && fingerprint !== null;
  const prefix      = `import:v${CACHE_VERSION}:${resource}:`;
  const cacheKey    = `${prefix}${query}:${fingerprint}`;

  if (useCache) {
    // entry() rather than get(), which answers null for a miss and for a stored
    // null alike — a .json file holding `null` would otherwise never cache
    const hit = await cache.entry(cacheKey);
    if (hit.state === 'fresh') return hit.value;
  }

  const result = await handler(path, options);

  // skip dom nodes, stylesheets and anything carrying functions
  if (useCache && isCacheable(result)) {
    try {
      // the third argument is an overrides object, not a number: passing the ttl
      // bare left entries with no expiry at all, since a Number has no .ttl
      await cache.set(cacheKey, result, { ttl: options.ttl ?? defaultTTL });
      // opportunistic sweep of expired siblings, deliberately not awaited
      cache.prune(prefix).catch(() => {});
    } catch (e) {
      console.warn(`[@aufbau/import] could not cache "${path}":`, e);
    }
  }

  return result;
}

export default importFile;
