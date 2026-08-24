// @aufbau/webfonts/index.js

import { fonts } from './data.js';

let baseFontUrl = 'https://code.pulgasari.dev/aufbau/webfonts';

// Category shortcuts mapped to standard CSS variables
const CATEGORY_VARS = {
  sans: '--aufbau-font-sans',
  serif: '--aufbau-font-serif',
  mono: '--aufbau-font-mono',
  code: '--aufbau-font-mono',
  heading: '--aufbau-font-heading',
  body: '--aufbau-font',
};

/**
 * Configure global settings like asset base URL
 */
export const configure = (options = {}) => {
  if (options.baseUrl) {
    baseFontUrl = options.baseUrl.replace(/\/$/, '');
  }
};

/**
 * Helper to find a font in the catalog by ID or Name
 */
export const findFont = (identifier) => {
  if (!identifier) return null;
  return fonts.find(f => f.id === identifier || f.name === identifier);
};

/**
 * Load a single font entry from catalog using FontFace API
 */
export const load = async (identifier) => {
  const fontData = findFont(identifier);
  if (!fontData) {
    console.warn(`[@aufbau/webfonts] Font "${identifier}" not found in catalog.`);
    return null;
  }

  const loadedFaces = await Promise.all(
    fontData.faces.map(async (face) => {
      const fullUrl = `${baseFontUrl}/${face.file}`;
      const descriptors = {
        style: face.style || 'normal',
        weight: String(face.weight || '400')
      };

      const fontFace = new FontFace(fontData.name, `url(${fullUrl})`, descriptors);
      
      try {
        const loaded = await fontFace.load();
        document.fonts.add(loaded);
        return loaded;
      } catch (err) {
        console.error(`[@aufbau/webfonts] Failed to load ${fontData.name}:`, err);
        return null;
      }
    })
  );

  return loadedFaces.filter(Boolean);
};

/**
 * Resolve DOM scope element safely from selector or HTMLElement
 */
const resolveScope = (scope) => {
  if (!scope) return document.documentElement;
  if (typeof scope === 'string') return document.querySelector(scope) || document.documentElement;
  if (typeof Element !== 'undefined' && scope instanceof Element) return scope;
  return document.documentElement;
};

/**
 * Resolve target CSS variable name from category, shortcut or custom var
 */
const resolveCssVar = (target) => {
  if (!target) return '--aufbau-font';
  if (target.startsWith('--')) return target;

  const lower = target.toLowerCase();
  if (CATEGORY_VARS[lower]) return CATEGORY_VARS[lower];

  return `--aufbau-font-${lower}`;
};

/**
 * Apply CSS variable for font-family flexibly
 */
export const apply = (fontInput, targetOrScope, varName) => {
  if (!fontInput) return;

  let fontName;
  let rawScope;
  let rawTarget;

  // Case 1: Object passed ({ name: 'manrope', target: 'sans', scope: '#app' })
  if (typeof fontInput === 'object' && !Array.isArray(fontInput)) {
    fontName = fontInput.name || fontInput.id || fontInput.font;
    rawScope = fontInput.scope || fontInput.element;
    rawTarget = fontInput.target || fontInput.var || fontInput.category;
  } else {
    fontName = fontInput;
  }

  // Case 2: Positional arguments handling
  if (!rawScope && !rawTarget && targetOrScope) {
    if (typeof targetOrScope === 'string') {
      // Check if string is a CSS selector (#id, .class, [data-*])
      if (targetOrScope.startsWith('#') || targetOrScope.startsWith('.') || targetOrScope.startsWith('[')) {
        rawScope = targetOrScope;
        rawTarget = varName;
      } else {
        rawTarget = targetOrScope;
        rawScope = varName;
      }
    } else {
      // Direct DOM element
      rawScope = targetOrScope;
      rawTarget = varName;
    }
  }

  const font = findFont(fontName);
  const familyName = font ? font.name : fontName;
  const fallback = font?.fallback ? `, ${font.fallback}` : ', sans-serif';

  const scope = resolveScope(rawScope);
  const cssVar = resolveCssVar(rawTarget);

  if (scope && familyName) {
    scope.style.setProperty(cssVar, `'${familyName}'${fallback}`);
  }
};

/**
 * Main initialization helper accepting strings, objects, or mixed arrays
 */
export const init = async (config) => {
  if (!config) return;

  const items = Array.isArray(config) ? config : [config];

  // 1. Load all fonts in parallel
  await Promise.all(
    items.map(item => {
      const id = typeof item === 'string' ? item : item.name || item.id || item.font;
      return load(id);
    })
  );

  // 2. Apply all fonts
  items.forEach(item => apply(item));
};

export { fonts };
