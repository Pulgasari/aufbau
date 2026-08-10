// aufbau/docs/sw.js
  
import { interceptFetch } from 'https://pulgasari.github.io/aufbau/kits/aufbau.js';    

const div = document.createElement('div');
div.textContent = `!!!sw!!!`;
document.body.append(div);

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Intercept Aufbau stylesheets and assets
      const aufbauResponse = await interceptFetch(event);
      if (aufbauResponse) return aufbauResponse;

      // Fallback to network fetch
      return fetch(event.request);
    })()
  );
});

/*
const CACHE_NAME = 'aufbau-cache-v1';
const MODULES_TO_CACHE = [
  './boot.js',
  './kits/aufbau.js',
  './elements/core/index.js'
];

// Install event: Pre-cache core JS modules
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(MODULES_TO_CACHE))
  );
});

// Fetch event: Serve cached modules instantly
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if found, otherwise request from network
      return cachedResponse || fetch(event.request);
    })
  );
});
*/
