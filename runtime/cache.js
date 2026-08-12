  // @aufbau/runtime/cache.js

const DEFAULT_NAMESPACE = 'aufbau';
const DEFAULT_NAME      = 'cache';

export function createCacheStorageDriver (options = {}) {
  const cacheName      = options.name      || DEFAULT_NAME;
  const cacheNamespace = options.namespace || DEFAULT_NAMESPACE;

  return {
    
    async clear () {
      return (await caches?.delete(cacheName)) ?? false;
    },

    async delete (key) {
      const cache = (await caches?.open(cacheName)) ?? null;
      return        (await cache?.delete(key))      ?? false;
    },
    
    async get (key) {
      try {
        const cache = (await caches?.open(cacheName)) ?? null;
        const match = (await cache?.match(key))       ?? null;
        return        (await match?.text())           ?? null;
      } 
      catch (e) { return null; }
    },

    async set (key, content) {
      try {
        const response = new Response (content, {headers: { 'Content-Type': 'text/css; charset=utf-8' }});   
        const cache    = (await caches?.open(cacheName)) ?? null;
        await cache?.put(key, response);
      }
      catch (e) { console.error('Failed to write to CacheStorage:', e); }
    },
    
  };
}
