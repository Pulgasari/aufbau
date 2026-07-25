// @aufbau/packages/stylesheet/src/worker.js

import transform from './index.js';

// Dateiendungen, die abgefangen werden
const TARGET_EXTENSIONS = [
  '.aufbau.css',
  '.ass'
];

/**
 * Prüft, ob ein Request abgefangen werden soll
 */
function shouldIntercept(url) {
  const pathname = new URL(url).pathname;
  return TARGET_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

/**
 * Service Worker Event Listener Registrierung
 */
export function setupServiceWorker() {
  self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method === 'GET' && shouldIntercept(request.url)) {
      event.respondWith(
        fetch(request)
          .then(response => response.text())
          .then(rawCode => {
            // Transformiert Aufbau CSS -> Standard CSS
            const transformedCss = transform(rawCode);

            // Antworte dem Browser direkt mit Content-Type text/css
            return new Response(transformedCss, {
              headers : {
                'Content-Type' : 'text/css; charset=utf-8'
              }
            });
          })
          .catch(err => {
            console.error('[Aufbau Worker] Fehler beim Transformieren:', err);
            return fetch(request);
          })
      );
    }
  });
}

// Falls die Datei als reiner Service Worker Script-Entrypoint geladen wird
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  setupServiceWorker();
}
