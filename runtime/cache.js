// @aufbau/runtime/cache.js

/*
clear
delete

get
getMeta
getOrFetch

set
setMeta

fetchCacheFirst
fetchStaleWhileRevalidate
staleWhileRevalidate
*/

const getContentHash = (str) => [...str].reduce((s,c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(36);


function createCache (options = {}) {

  const { name = 'cache', namespace = 'aufbau' } = options;
  const cacheName = namespace + ':' + name;

  // hoisted because the higher level methods below call them.
  // everything that is not referenced internally stays inline in the returned object.

  const set = async (key, content, options = {}) => {
    const { type = 'text/plain', charset = 'utf-8', headers = {} } = options;
    try {
      const response = new Response (content, { headers: { 'Content-Type': charset ? (type + '; charset=' + charset) : type, ...headers }});   
      const cache    = (await caches?.open(cacheName)) ?? null;
      await cache?.put(key, response);
    }
    catch (e) { console.error('Failed to write to CacheStorage:', e); }
  };

  const getMeta = async (key) => {
    try {
      const cache = (await caches?.open(cacheName)) ?? null;
      const match = (await cache?.match(key))       ?? null;
      return        (await match?.json())           ?? null;
    }
    catch (e) { return null; }
  };

  const setMeta = async (key, content, hash) => {
    await set(key, JSON.stringify({ content, hash }), { type: 'application/json' });
  };

  // private. fetch, transform, store.
  // returns null when the source is unchanged, unreachable or not ok.
  const load = async (key, { url, fetchOptions, transform, knownHash = null }) => {
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) return null;

      const raw  = await response.text();
      const hash = getContentHash(raw);
      if (hash === knownHash) return null;

      const content = await transform(raw);
      await setMeta(key, content, hash);
      return { content, hash };
    }
    catch (e) { console.warn('Fetch failed:', key, e); return null; }
  };

  return {

    // --- raw layer

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

    set,
    getMeta,
    setMeta,

    // --- text layer: transformed content + source hash in a json envelope

    // cache-first. hit wins, no revalidation. transform only runs on a miss.
    async getOrFetch (key, options = {}) {
      const { url = key, fetchOptions = { cache: 'no-cache' }, transform = (raw) => raw } = options;

      const cached = await getMeta(key);
      if (cached?.content) return cached.content;

      const fresh = await load(key, { url, fetchOptions, transform });
      return fresh?.content ?? null;
    },

    // returns the cached value right away plus a promise for the revalidation pass.
    // the caller decides whether to await it (cold start) or let it run (warm start).
    async staleWhileRevalidate (key, options = {}) {
      const {
        url          = key,
        fetchOptions = { cache: 'no-cache' },
        transform    = (raw) => raw,
        onRevalidate = null,
      } = options;

      const cached = await getMeta(key);
      const stale  = cached?.content ?? null;

      const revalidated = (async () => {
        const fresh = await load(key, { url, fetchOptions, transform, knownHash: cached?.hash ?? null });
        if (fresh) await onRevalidate?.(fresh.content, { key, hash: fresh.hash, stale });
        return fresh?.content ?? null;
      })();

      return { stale, revalidated };
    },

    // --- response layer: raw responses for the service worker, binary safe, no envelope

    async fetchCacheFirst (request) {
      const cache  = (await caches?.open(cacheName)) ?? null;
      const cached = (await cache?.match(request))   ?? null;
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) await cache?.put(request, response.clone());
      return response;
    },

    async fetchStaleWhileRevalidate (request, options = {}) {
      const { onUpdate = null } = options;

      const cache  = (await caches?.open(cacheName)) ?? null;
      const cached = (await cache?.match(request))   ?? null;

      const fetching = fetch(request)
        .then((response) => {
          if (!response.ok) return cached ?? response;
          // etag comparison instead of body hashing, the payload may be binary
          if (cached && cached.headers.get('etag') !== response.headers.get('etag')) onUpdate?.(request);
          cache?.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      return cached ?? fetching;
    },

  };
}

export { createCache, getContentHash };
export default createCache;

/*
// @aufbau/runtime/cache.js

const getContentHash = (str) => [...str].reduce((s,c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(36);


function createCache (options = {}) {
  
  const { name = 'cache', namespace = 'aufbau' } = options;
  const cacheName = namespace + ':' + name;

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

    async set (key, content, options = {}) {
      const { charset = 'utf-8', headers = {}, type = 'text/plain' } = options;
      try {
        const response = new Response (content, { headers: { 'Content-Type': charset ? (type + '; charset=' + charset) : type, ...headers }});   
        const cache    = (await caches?.open(cacheName)) ?? null;
        await cache?.put(key, response);
      }
      catch (e) { console.error('Failed to write to CacheStorage:', e); }
    }

    async getMeta (key) {
      try {
        const cache = (await caches?.open(cacheName)) ?? null;
        const match = (await cache?.match(key))       ?? null;
        return        (await match?.json())           ?? null;
      } 
      catch (e) { return null; }
    },

    async setMeta (key, content, hash) {
      try {
        const payload  = JSON.stringify({ content, hash });
        const response = new Response(payload, { headers: { 'Content-Type': 'application/json; charset=utf-8' }});   
        const cache    = (await caches?.open(cacheName)) ?? null;
        await cache?.put(key, response);
      }
      catch (e) { console.error('Failed to write to CacheStorage:', e); }
    },
    
  };
}

export { createCache, getContentHash };
export default createCache;
*/
