// @aufbau/stylesheet/plugins/vite.js

import transform from './index.js';

/**
 * Vite Plugin für Aufbau Stylesheet
 * @param {Object} options
 * @param {RegExp} [options.include=/\.(aufbau\.css|ass)$/] - Regex für Dateiendungen
 */
export default function aufbauStylesheetPlugin (options = {}) {
  const fileRegex = options.include || /\.(aufbau\.css|ass)$/;

  return {
    name: 'vite-plugin-aufbau-stylesheet',
    enforce: 'pre', // Läuft VOR den Standard-CSS Plugins von Vite

    transform(code, id) {
      if (!fileRegex.test(id)) return null;

      try {
        const transformedCss = transform(code);
        return {
          code: transformedCss,
          map: null // In Phase 1 ohne Source Maps
        };
      } catch (err) {
        this.error(`[Aufbau Vite Plugin] Fehler in ${id}: ${err.message}`);
      }
    }
  };
}
