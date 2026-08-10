# optimize

```
rel='preload'
async
defer

caching
```

```javascript
// docs/sw.js
const CACHE_NAME = 'aufbau-cache-v1';
const MODULES_TO_CACHE = [
  './boot.js',
  './kits/aufbau.js',
  './elements/core/index.js'
];

// Install event: Pre-cache core JS modules
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(MODULES_TO_CACHE))
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
```
