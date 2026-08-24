// @aufbau/webfonts

import { fonts } from './data.js';

// Base CDN or local path for font assets
let baseFontUrl = 'https://code.pulgasari.dev/aufbau/webfonts';

/**
 * Configure global settings like asset base URL
 */
export const configureWebfonts = (options = {}) => {
  if (options.baseUrl) {
    baseFontUrl = options.baseUrl.replace(/\/$/, '');
  }
};

/**
 * Helper to find a font in the catalog by ID or Name
 */
export const findFont = (identifier) => {
  return fonts.find(f => f.id === identifier || f.name === identifier);
};

/**
 * Load a single font entry from catalog using FontFace API
 */
export const loadFont = async (identifier) => {
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
 * Apply CSS variable for font-family
 */
export const applyFont = (fontName, scope = document.documentElement, varName = '--aufbau-font') => {
  if (!fontName || !scope) return;
  const font = findFont(fontName);
  const familyName = font ? font.name : fontName;
  const fallback = font?.fallback ? `, ${font.fallback}` : ', sans-serif';

  scope.style.setProperty(varName, `'${familyName}'${fallback}`);
};

/**
 * Main initialization helper
 */
export const initWebfonts = async (config) => {
  if (!config) return;

  const fontList = Array.isArray(config) ? config : [config];
  
  // Load all specified fonts in parallel
  await Promise.all(fontList.map(item => {
    const id = typeof item === 'string' ? item : item.id || item.name;
    return loadFont(id);
  }));

  // Apply primary font to root element
  const primary = fontList[0];
  const primaryName = typeof primary === 'string' ? primary : primary.id || primary.name;
  if (primaryName) {
    applyFont(primaryName);
  }
};

export { fonts };
