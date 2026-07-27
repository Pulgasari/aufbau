// @aufbau/plugins/vite

import transform from '@aufbau/stylesheet';

const TARGET_EXTENSIONS = ['.aufbau.css', '.ass'];

/**
 * Vite plugin to transform Aufbau stylesheets during build and development.
 */
export function aufbauStylesheet () {
  return {
    name: 'vite-plugin-aufbau-stylesheet',
    transform(code, id) {
      const isTarget = TARGET_EXTENSIONS.some(ext => id.endsWith(ext));
      if (!isTarget) return null;

      return {
        code: transform(code),
        map: null
      };
    }
  };
}
