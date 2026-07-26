// @aufbau/stylesheet/plugins/vite.js

import transform from './../index.js';

/**
 * Vite Plugin for Aufbau Stylesheet
 * @param {Object} [options]
 * @param {RegExp} [options.include=/\.(aufbau\.css|ass)$/] - Regex for targeted file extensions
 */
export default function aufbauStylesheetPlugin (options = {}) {
  const fileRegex = options.include || /\.(aufbau\.css|ass)$/;

  return {
    name    : 'vite-plugin-aufbau-stylesheet',
    enforce : 'pre',

    transform(code, id) {
      if (!fileRegex.test(id)) return null;

      try {
        const transformedCss = transform(code);
        return {
          code : transformedCss,
          map  : null
        };
      } catch (err) {
        this.error(`[Aufbau Vite Plugin] Error processing ${id}: ${err.message}`);
      }
    }
  };
}
