# optimize

```
rel='preload'
async
defer

caching
```

# Snippets for Service Workers

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

```javascript
// sw.js - Service Worker in the consuming application
const CACHE_NAME = 'aufbau-cdn-cache-v1';

// Match URLs from CDNs or specific library paths
const CDN_PATTERN = /^https:\/\/(cdn\.jsdelivr\.net|esm\.sh|unpkg\.com)\/.*aufbau.*/;

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Intercept requests matching the CDN pattern
  if (CDN_PATTERN.test(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // 1. try to get module from cache
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        // 2. fetch from CDN if not cached yet
        try {
          const networkResponse = await fetch(event.request);
          // cache the fetched CDN module for future requests
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('Failed to fetch module from CDN:', error);
          throw error;
        }
      })
    );
  }
});
```

# Infos

## Caching-Strategien

### ​Cache-First (Stale-Never)

Der Service Worker fängt jede Netzwerkanfrage ab. Er prüft im CacheStorage des Browsers, ob das Modul vorliegt. Ist es da, wird es direkt vom lokalen Speicher zugestellt – die Netzwerkanfrage an den Server wird komplett unterdrückt (0 ms Netzwerk-Latenz). Dies ist ideal für unveränderliche Versionen oder Vendor-Module.

### ​Network-First

Der Service Worker versucht zuerst, die neueste Modulversion vom Server zu holen. Gelingt dies (z. B. online), aktualisiert er den Cache und liefert die Datei aus. Schlägt die Anfrage fehl (offline oder schlechtes Netz), greift er auf den lokalen Cache als Fallback zurück.

### ​Stale-While-Revalidate

Das Modul wird sofort aus dem Cache an die Anwendung geliefert (schnellstmögliche Ladezeit). Gleichzeitig sendet der Service Worker im Hintergrund eine Netzwerkanfrage, um den Cache für den nächsten Seitenaufruf zu aktualisieren.
