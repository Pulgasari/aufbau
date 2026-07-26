// @aufbau/stylesheet

import { extractTokens, transformTokenProperties } from './skills/tokens.js';
import { observeDom }    from './plugins/client.js';
import transformCenter   from './skills/center.js';
import transformIcons    from './skills/icon.js';
import transformLayouts  from './skills/layout.js';
import transformMedia    from './skills/media.js';
import transformShader   from './skills/shader.js';
import transformWebfonts from './skills/webfont.js';
import { transformFlex, transformGrid } from './skills/layout.js';

// :::::: pre-compiled RegExp rules

const REGEX_AUFBAU_PROPERTIES = /(aufbau-[a-z-]+)\s*:\s*([^;}\n]+);?/g;

// :::::: cache

const TRANSFORM_CACHE = new Map();
const MAX_CACHE_SIZE  = 500;

function fastHash (str) {
  let hash = 5381;
  let i    = str.length;
  while (i) hash = (hash * 33) ^ str.charCodeAt(--i);
  return hash >>> 0;
}

/**
 * Level 3: Single-Pass Property Matcher
 * Verarbeitet alle `aufbau-*` Custom Properties in EINEM EINZIGEN Durchlauf.
 */
function transformSmartProperties (code, tokens) {
  return code.replace(REGEX_AUFBAU_PROPERTIES, (fullMatch, prop, rawVal) => {
    switch (prop) {
      case 'aufbau-flex'   : return transformFlex(rawVal, tokens);
      case 'aufbau-grid'   : return transformGrid(rawVal, tokens);
      case 'aufbau-center' : return transformCenter(rawVal);
      case 'aufbau-icon'   : return transformIcons(rawVal, tokens);
      case 'aufbau-shader' : return transformShader(fullMatch);
      case 'aufbau-colors' : {
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
function runPipeline (code) {
  // 1. Extract @aufbau blocks and generate tokens
  const { tokens, code: step1 } = extractTokens(code);

  // 2. Webfonts processing (@imports)
  const { code: step2, imports } = transformWebfonts(step1);

  // 3. Level 3: Single-Pass Smart Properties (flex, grid, center, icon, colors in 1 pass)
  let result = transformSmartProperties(step2, tokens);

  // 4. Media Queries & Breakpoints
  result = transformMedia(result, tokens);

  // 5. Token Properties & Shadows
  result = transformTokenProperties(result, tokens);

  // 6. Font @imports insertion
  if (imports.length > 0) {
    const importStatements = imports.map(url => `@import url("${url}");`).join('\n');
    result = `${importStatements}\n\n${result}`;
  }

  return result;
}

/**
 * Haupt-Transform-Funktion für Aufbau Stylesheet mit Level 1 In-Memory Caching
 */
export default function transform (code) {
  if (!code) return '';

  // Level 1: Fast Cache-Hit Check (0ms)
  const cacheKey = fastHash(code);
  if (TRANSFORM_CACHE.has(cacheKey)) {
    return TRANSFORM_CACHE.get(cacheKey);
  }

  // Cache Miss: Perform Pipeline
  const result = runPipeline(code);

  // Maintain max cache size (LRU eviction)
  if (TRANSFORM_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = TRANSFORM_CACHE.keys().next().value;
    TRANSFORM_CACHE.delete(oldestKey);
  }

  TRANSFORM_CACHE.set(cacheKey, result);
  return result;
}


/**
 * Helper: Registriert den Service Worker für .aufbau.css / .ass Dateien
 */
export async function registerServiceWorker (swPath = '/aufbau-worker.js') {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register(swPath, { scope: '/' });
      console.log('[Aufbau] Service Worker aktiv mit Scope:', reg.scope);
    } catch (err) {
      console.error('[Aufbau] Service Worker Registrierung fehlgeschlagen:', err);
    }
  }
}

/**
 * Helper: Startet die vollständige Browser-Runtime (Client Observer + Worker)
 */
export function initBrowser (options = {}) {
  if (typeof window === 'undefined') return;

  // DOM Observer für <style type="text/aufbau">
  observeDom();

  // Service Worker optional mit-registrieren
  if (options.useWorker) registerServiceWorker(options.workerPath);
}
