// @aufbau/stylesheet

import { extractTokens, transformTokenProperties } from './tokens.js';
import { observeDom }    from './client.js';
import transformLayouts  from './layout.js';
import transformWebfonts from './webfont.js';

/**
 * Haupt-Transform-Funktion
 */
export default function transform (code) {
  if (!code) return '';

  const { tokens,  code: codeWithoutBlocks   } = extractTokens(code);
  const { imports, code: codeFontTransformed } = transformWebfonts(codeWithoutBlocks);
  
  let result = transformLayouts(codeFontTransformed, tokens);
  result = transformTokenProperties(result, tokens);

  if (imports.length > 0) {
    const importStatements = imports.map(url => `@import url("${url}");`).join('\n');
    result = `${importStatements}\n\n${result}`;
  }

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
  if (options.useWorker) {
    registerServiceWorker(options.workerPath);
  }
}
