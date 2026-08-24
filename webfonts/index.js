// @aufbau/webfonts/index.js

import { fonts } from './data.js';

let baseFontUrl = 'https://code.pulgasari.dev/aufbau/webfonts';
const loadedFonts = new Set();

const CATEGORY_VARS = {
  sans:    '--aufbau-font-sans',
  serif:   '--aufbau-font-serif',
  mono:    '--aufbau-font-mono',
  code:    '--aufbau-font-mono',
  heading: '--aufbau-font-heading',
  body:    '--aufbau-font',
};

/**
 * Configure global settings like asset base URL
 */
export const configure = (options = {}) => {
  if (options.baseUrl) baseFontUrl = options.baseUrl.replace(/\/$/, '');
};

/**
 * Find font entry in catalog by ID or Name
 */
export const findFont = (id) => id ? fonts.find(f => f.id === id || f.name === id) : null;

/**
 * Load a single font entry from catalog using FontFace API
 */
export const load = async (identifier) => {
  const fontData = findFont(identifier);
  if (!fontData) {
    console.warn(`[@aufbau/webfonts] Font "${identifier}" not found in catalog.`);
    return null;
  }

  // Prevent redundant network requests
  if (loadedFonts.has(fontData.id)) return true;

  const loadedFaces = await Promise.all(
    fontData.faces.map(async (face) => {
      const fullUrl = `${baseFontUrl}/${face.file}`;
      const descriptors = {
        style: face.style || 'normal',
        weight: String(face.weight || '400'),
        display: face.display || 'swap',
      };

      try {
        const fontFace = new FontFace(fontData.name, `url(${fullUrl})`, descriptors);
        const loaded = await fontFace.load();
        document.fonts.add(loaded);
        return loaded;
      } catch (err) {
        console.error(`[@aufbau/webfonts] Failed to load face for ${fontData.name}:`, err);
        return null;
      }
    })
  );

  const success = loadedFaces.some(Boolean);
  if (success) loadedFonts.add(fontData.id);
  return success;
};

/**
 * Resolve target CSS variable name from category shortcut or custom property
 */
const resolveCssVar = (target = 'body') => {
  if (target.startsWith('--')) return target;
  const key = target.toLowerCase();
  return CATEGORY_VARS[key] || `--aufbau-font-${key}`;
};

/**
 * Resolve DOM scope element from selector string, HTMLElement, or default to root
 */
const resolveScope = (scope) => {
  if (typeof Element !== 'undefined' && scope instanceof Element) return scope;
  if (typeof scope === 'string') return document.querySelector(scope) || document.documentElement;
  return document.documentElement;
};

/**
 * Safely check if a value is a DOM Element or a valid CSS selector targeting a node
 */
const isScopeValue = (val) => {
  if (!val) return false;
  if (typeof Element !== 'undefined' && val instanceof Element) return true;
  if (typeof val === 'string') {
    if (val.startsWith('--') || val in CATEGORY_VARS) return false;
    if (val.startsWith('#') || val.startsWith('.') || val.startsWith('[') || val.startsWith(':')) return true;
    try {
      return document.querySelector(val) !== null;
    } catch {
      return false;
    }
  }
  return false;
};

/**
 * Normalize flexible input arguments for apply()
 */
const normalizeApplyInput = (fontInput, arg2, arg3) => {
  let name = fontInput;
  let target;
  let scope;

  if (typeof fontInput === 'object' && fontInput !== null && !Array.isArray(fontInput)) {
    name = fontInput.name || fontInput.id || fontInput.font;
    target = fontInput.target || fontInput.var || fontInput.category;
    scope = fontInput.scope || fontInput.element;
  } else {
    if (isScopeValue(arg2)) {
      scope = arg2;
      target = arg3;
    } else {
      target = arg2;
      scope = arg3;
    }
  }

  return { name, target, scope };
};

/**
 * Apply CSS variable for font-family flexibly
 */
export const apply = (fontInput, arg2, arg3) => {
  const { name, target, scope } = normalizeApplyInput(fontInput, arg2, arg3);
  if (!name) return;

  const font = findFont(name);
  const familyName = font ? font.name : name;
  const fallback = font?.fallback ? `, ${font.fallback}` : ', sans-serif';

  const targetEl = resolveScope(scope);
  const cssVar = resolveCssVar(target);

  targetEl.style.setProperty(cssVar, `'${familyName}'${fallback}`);
};

/**
 * Main initialization helper accepting strings, objects, or mixed arrays
 */
export const init = async (config) => {
  if (!config) return;
  const items = Array.isArray(config) ? config : [config];

  // Load all unique fonts in parallel
  await Promise.all(
    items.map(item => {
      const id = typeof item === 'string' ? item : item.name || item.id || item.font;
      return load(id);
    })
  );

  // Apply CSS variables for each item
  items.forEach(item => apply(item));
};

export { fonts };
