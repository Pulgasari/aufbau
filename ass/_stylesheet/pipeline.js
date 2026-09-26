// @aufbau/stylesheet

// :::::: IMPORTS

import { parsePattern }  from './skills/pattern.js';
import transformCenter   from './skills/center.js';
import transformConfig   from './skills/config.js';
import transformDirty    from './skills/dirty.js';
import transformFilter   from './skills/filter.js';
import transformIcons    from './skills/icon.js';
import transformLayouts  from './skills/layout.js';
import transformMedia    from './skills/media.js';
import transformPattern  from './skills/pattern.js';
import transformTraits   from './skills/trait.js';
import transformUnset    from './skills/unset.js';
import transformWebfonts from './skills/webfont.js';

import { transformFlex, transformGrid }            from './skills/layout.js';
import { extractTokens, transformTokenProperties } from './skills/tokens.js';

import { ensureFilter } from './../filters/index.js';  // @aufbau/filters
import { patternImage } from './../patterns/index.js'; // @aufbau/patterns
//import { observeDom } from './plugins/client.js';

// :::::: MOVE IT OUT

// const unique = [...new Set(array)];
// const unique = Array.from(new Set(array));
function mergeUnique (...arrays) {
  const set = new Set();
  for (let i = 0; i < arrays.length; i++) {
    const arr = arrays[i];
    for (let j = 0; j < arr.length; j++) {
      set.add(arr[j]);
    }
  }
  return Array.from(set);
}

// ::: cache

const TRANSFORM_CACHE = new Map;
const MAX_CACHE_SIZE  = 500;

function fastHash (str) {
  let hash = 5381;
  let i    = str.length;
  while (i) hash = (hash * 33) ^ str.charCodeAt(--i);
  return hash >>> 0;
}

// :::::: REGEXP PATTERNS

const REGEX_AUFBAU_PROPERTIES = /(aufbau-[a-z-]+)\s*:\s*([^;}\n]+);?/g;
const REGEX_FILTER_USAGE  = /aufbau-filter:\s*([a-z0-9-]+)/gi;
const REGEX_PATTERN_USAGE = /aufbau-pattern:\s*([^;}\n]+);?/g;

// ::::::

/**
 * async pre-pass: for every distinct aufbau-pattern declaration, build its
 * data-uri up front. the synchronous pipeline then only looks results up.
 * keyed by the trimmed raw value so the sync transform matches without reparsing.
 */
async function buildPatternImages (code, tokens) {
  const seen = new Map; // rawVal -> { id, options }
  for (const m of code.matchAll(REGEX_PATTERN_USAGE)) {
    const rawVal = m[1].trim();
    if (!seen.has(rawVal)) seen.set(rawVal, parsePattern(rawVal, tokens));
  }

  const images = {};
  await Promise.all([...seen].map(async ([rawVal, { id, options }]) => {
    try   { images[rawVal] = await patternImage(id, options); }
    catch {} // leave unresolved; transformPattern falls back to the untouched declaration
  }));
  return images;
}

/**
 * async pre-pass: inject the <filter> defs for every filter referenced in the
 * source, so the compiled `filter: url(#id)` resolves. returns the set of ids
 * whose defs are present, which the sync transform checks before emitting.
 */
async function injectFilterDefs (code) {
  const ids = new Set();
  for (const m of code.matchAll(REGEX_FILTER_USAGE)) ids.add(m[1]);

  const ready = new Set();
  await Promise.all([...ids].map(async id => {
    try {
      await ensureFilter(id);
      ready.add(id);
    } catch {
      // leave out; transformFilter falls back to the untouched declaration
    }
  }));
  return ready;
}

/**
 * Level 3: Single-Pass Property Matcher
 * Verarbeitet alle `aufbau-*` Custom Properties in EINEM EINZIGEN Durchlauf.
 */
function transformSmartProperties (code, tokens) {
  return code.replace(REGEX_AUFBAU_PROPERTIES, (fullMatch, prop, rawVal) => {
    switch (prop) {
      case 'aufbau-flex'    : return transformFlex    (rawVal, tokens);
      case 'aufbau-grid'    : return transformGrid    (rawVal, tokens);
      case 'aufbau-center'  : return transformCenter  (rawVal);
      case 'aufbau-icon'    : return transformIcons   (rawVal, tokens);
      case 'aufbau-filter'  : return transformFilter  (rawVal, tokens);
      case 'aufbau-pattern' : return transformPattern (rawVal, tokens);
      case 'aufbau-colors'  : {
        const parts      = rawVal.trim().split(/\s+/);
        const pairName   = parts[0];
        const isInverted = parts.includes('inverted') || parts.includes('invert');
        const pair       = tokens.colors?.[pairName];
        if (!pair) return fullMatch;
        const bg = isInverted ? pair.fg : pair.bg;
        const fg = isInverted ? pair.bg : pair.fg;
        return `background-color: ${bg}; color: ${fg};`;
      }
      default: return fullMatch;
    }
  });
}

/**
 * Pipeline Execution Function
 */
function runPipeline (code, pretokens) {
  // 0. Config-Verarbeitung (@aufbau-config)
  const { code: step0, imports: configImports, charset, fontRules } = transformConfig(code);

  // Generierte Font-Regeln einfügen, damit webfont.js sie aufgreift
  const codeWithFonts = fontRules.length > 0
    ? `${fontRules.join('\n')}\n\n${step0}`
    : step0;

  // 0b. Expand aufbau-dirty shorthands early
  const step0b = codeWithFonts.replace(/aufbau-dirty\s*:\s*([^;}\n]+);?/g, (_, rawVal) => {
    return transformDirty(rawVal);
  });

  // 0c. Expand aufbau-unset shorthands early
  const step0c = step0b.replace(/aufbau-unset\s*:\s*([^;}\n]+);?/g, (_, rawVal) => {
    return transformUnset(rawVal);
  });
  
  // 1. Extract @aufbau blocks and generate tokens
  // const { tokens, code: step1 } = extractTokens(step0c);

  // 1. tokens: reuse the ones from transform() if given, else extract now.
  //    the code still needs the @aufbau blocks stripped either way.
  const extracted = extractTokens(step0c);
  const tokens    = pretokens ?? extracted.tokens;
  if (pretokens) pretokens.patternImages ??= {}; // safety if called directly
  const step1 = extracted.code;

  // 1b. Process traits (@aufbau-trait & aufbau-use)
  const step1b = transformTraits(step1);

  // 2. Webfonts processing (@imports)
  const { code: step2, imports: webfontImports } = transformWebfonts(step1b);

  // 3. Level 3: Single-Pass Smart Properties (flex, grid, center, icon, colors in 1 pass)
  let result = transformSmartProperties(step2, tokens);

  // 4. Media Queries & Breakpoints
  result = transformMedia(result, tokens);

  // 5. Token Properties & Shadows
  result = transformTokenProperties(result, tokens);

  // 6. Header assembly (@import & @charset)
  //const allImportUrls = [...configImports, ...webfontImports];
  const allImportUrls = mergeUnique(configImports, webfontImports);
  let prefix = '';
  if (allImportUrls.length > 0) {
    prefix += allImportUrls.map(url => `@import url('${url}');`).join('\n') + '\n\n';
  }
  if (charset) prefix += `${charset}\n\n`;
  return `${prefix}${result}`.trim();
}

/**
 * Haupt-Transform-Funktion für Aufbau Stylesheet mit Level 1 In-Memory Caching
 */
export default async function transform (code) {
  if (!code) return '';

  // Level 1: Fast Cache-Hit Check (0ms)
  const cacheKey = fastHash(code);
  if (TRANSFORM_CACHE.has(cacheKey)) return TRANSFORM_CACHE.get(cacheKey);

  // tokens are needed by the pattern pre-pass (colour resolution), so extract
  // once here; runPipeline receives them and skips re-extracting.
  const { tokens } = extractTokens(code);
  tokens.patternImages = await buildPatternImages(code, tokens);
  tokens.filterIds     = await injectFilterDefs(code);

  // Cache Miss: Perform Pipeline
  const result = runPipeline(code, tokens);

  // Maintain max cache size (LRU eviction)
  if (TRANSFORM_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = TRANSFORM_CACHE.keys().next().value;
    TRANSFORM_CACHE.delete(oldestKey);
  }

  TRANSFORM_CACHE.set(cacheKey, result);
  return result;
}
