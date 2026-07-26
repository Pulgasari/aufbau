// @aufbau/stylesheet

import { extractTokens, transformTokenProperties } from './tokens.js';
import { observeDom }    from './client.js';
import transformCenter   from './center.js';
import transformIcons    from './icon.js';
import transformLayouts  from './layout.js';
import transformWebfonts from './webfont.js';

export default function transform (code) {
  if (!code) return '';

  // 1. Tokens extrahieren & @aufbau Blöcke entfernen
  const { tokens, code: step1 } = extractTokens(code);

  // 2. Webfonts verarbeiten (@imports)
  const { code: step2, imports } = transformWebfonts(step1);

  // 3. Smart Properties verarbeiten
  let result = transformLayouts(step2, tokens);
  result = transformCenter(result);
  result = transformIcons(result, tokens);

  // 4. Tokens & Shades auflösen
  result = transformTokenProperties(result, tokens);

  // 5. Google Font @imports oben einfügen
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
