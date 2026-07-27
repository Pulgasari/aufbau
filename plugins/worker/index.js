// @aufbau/plugins/worker

import transform from '@aufbau/stylesheet';

const TARGET_EXTENSIONS = ['.aufbau.css', '.ass'];
const REGEX_TARGET_EXT  = new RegExp(`(${TARGET_EXTENSIONS.map(ext => ext.replace('.', '\\.')).join('|')})$`, 'i');    

/**
 * Service Worker fetch handler for intercepting .aufbau.css / .ass network requests.
 * @param {FetchEvent} event
 * @returns {Promise<Response>|null}
 */
export async function handleStylesheetFetch (event) {
  const request = event.request;
  if (request.method !== 'GET') return null;

  const url = new URL(request.url);
  if (!REGEX_TARGET_EXT.test(url.pathname)) {
    return null;
  }

  try {
    const response = await fetch(request);
    if (!response.ok) return response;

    const rawCode = await response.text();
    const transformedCss = transform(rawCode);

    return new Response(transformedCss, {
      headers: { 'Content-Type': 'text/css; charset=utf-8' }
    });
  } catch (err) {
    console.error('[@aufbau/plugins/worker] Service Worker stylesheet fetch error:', err);
    return null;
  }
}

/**
 * Helper function for dedicated Web Workers to parse stylesheet content off the main thread.
 * @param {string} rawCode
 * @returns {string} Transformed CSS
 */
export function parseStylesheetWorkerMessage (rawCode) {
  if (!rawCode) return '';
  return transform(rawCode);
}
