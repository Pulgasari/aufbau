// @aufbau/plugins/worker

import transform from '@aufbau/stylesheet';

const TARGET_EXTENSIONS = ['.aufbau.css', '.ass'];
const REGEX_TARGET_EXT  = new RegExp(`(${TARGET_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')})$`, 'i');    

/**
 * Service Worker fetch handler for intercepting .aufbau.css / .ass network requests.
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
export async function interceptFetchStylesheet (event) {
  const request = event.request; if (request.method !== 'GET') return null;
  
  const url = new URL(request.url);
  if (!REGEX_TARGET_EXT.test(url.pathname)) { return null; }

  try {
    const res = await fetch(request); if (!res.ok) return res;
    const ass = await res.text();
    const css = transform(ass);
    return new Response (css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
  } catch (e) {
    console.error('[@aufbau/plugins/worker] Service Worker stylesheet fetch error:', e);
    return null;
  }
}

/**
 * Helper function for dedicated Web Workers to parse stylesheet content off the main thread.
 * @param {string} rawCode
 * @returns {string} Transformed CSS
 */
export function parseStylesheetWorkerMessage (ass) {
  return ass ? transform(ass) : '';
}
