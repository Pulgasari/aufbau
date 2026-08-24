// @aufbau/webfonts/index.js

// :::::: IMPORTS

import { fonts } from './data.js';
import { isElement, isObject, isString } from '@pulgasari/is';

// :::::: META

const baseFontUrl = 'https://code.pulgasari.dev/aufbau/webfonts';
const loadedFonts = new Set();

const VARS = {
  body    : '--aufbau-font',
  code    : '--aufbau-font-mono',
  heading : '--aufbau-font-heading',
  mono    : '--aufbau-font-mono',
  sans    : '--aufbau-font-sans',
  serif   : '--aufbau-font-serif',
};

// :::::: HELPERS

const isScopeValue = (val) => {
  if (!val) return false;
  if (isElement(val)) return true;
  if (isString(val)) {
    if (val.startsWith('--') || val in VARS) return false;
    if (val.startsWith('#')  || val.startsWith('.') || val.startsWith('[') || val.startsWith(':')) return true;
    try   { return document.querySelector(val) !== null; }
    catch { return false; }
  }
  return false;
};

const normalizeApplyInput = (input) => {
  if (!input) return {};

  // Single options object format with flexible aliases
  if (isObject(input)) {
    return {
      name   : input.name   || input.id      || input.font,
      target : input.target || input.var     || input.category,
      scope  : input.scope  || input.element || input.el,
    };
  }

  // String shorthand format: apply('Manrope')
  if (isString(input)) return { name: input };

  return {};
};

const resolveCssVar = (target = 'body') => {
  if (target.startsWith('--')) return target;
  const key = target.toLowerCase();
  return VARS[key] || `--aufbau-font-${key}`;
};

const resolveScope = (scope) => {
  if (isElement (scope)) return scope;
  if (isString  (scope)) return document.querySelector(scope) || document.documentElement;
  return document.documentElement;
};

// :::::: API

// find font entry in catalog by ID or Name
const findFont = (id) => id ? fonts.find(f => f.id === id || f.name === id) : null;

// load a single font entry from catalog using FontFace API
const load = async (identifier) => {
  const fontData = findFont(identifier);
  if (!fontData) {
    console.warn(`[@aufbau/webfonts] Font "${identifier}" not found in catalog.`);
    return null;
  }

  // Prevent redundant network requests
  if (loadedFonts.has(fontData.id)) return true;

  const loadedFaces = await Promise.all(
    fontData.faces.map(async (face) => {
      // face.file is a repo-relative path (downloaded fonts) or an absolute url
      // (generator run with --remote), used as-is in that case
      const fullUrl = /^https?:\/\//.test(face.file) ? face.file : `${baseFontUrl}/${face.file}`;
      const descriptors = {
        style   : face.style || 'normal',
        weight  : String(face.weight || '400'),
        display : face.display || 'swap',
      };

      try {
        const fontFace = new FontFace(fontData.name, `url(${fullUrl})`, descriptors);
        const loaded   = await fontFace.load();
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

const apply = (fontInput) => {
  const { name, target, scope } = normalizeApplyInput(fontInput);
  if (!name) return;

  const font       = findFont(name);
  const familyName = font ? font.name : name;
  const fallback   = font?.fallback ? `, ${font.fallback}` : ', sans-serif';
  const targetEl   = resolveScope(scope);
  const cssVar     = resolveCssVar(target);

  targetEl.style.setProperty(cssVar, `'${familyName}'${fallback}`);
};

const init = async (config) => {
  if (!config) return;
  const items = Array.isArray(config) ? config : [config];

  // Load all unique fonts in parallel
  await Promise.all(
    items.map(item => {
      const id = isString(item) ? item : item.name || item.id || item.font;
      return load(id);
    })
  );

  // Apply CSS variables for each item
  items.forEach(apply);
};

// :::::: EXPORTS

export { 
  fonts,
  apply,
  findFont,
  init,
  load,
};
