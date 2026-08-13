// @aufbau/runtime/cache.js | 10.2

/*
pull        =  private. pull from source, transform, store.
               returns null when the source is unchanged, unreachable or not ok.
getAndPull  =  returns the cached value right away, pulls in any case.
               pulled resolves to null when nothing changed. await it on a cold start, ignore it otherwise.
getOrPull   =  pulls only on a miss. a hit guarantees zero requests.

--- createResponseCache
getAndPull  =   pulled resolves to null when offline or not ok, so guard before responding with it.
*/

// :::::: HELPERS

const getContentHash = (str) => [...str].reduce((s,c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(36);

// ::::: WRAPPER

// text layer. stores transformed content plus the source hash in a header.
function createCache (options = {}) {

  const { name = 'cache', namespace = 'aufbau' } = options;
  const cacheName = namespace + ':' + name;

  const set = async (key, content, options = {}) => {
    const { type = 'text/plain', charset = 'utf-8', hash = null, headers = {} } = options;
    try {
      const response = new Response(content, {
        headers: { // pass charset: null for binary payloads
          'Content-Type': charset ? type + '; charset=' + charset : type,
          ...(hash && { 'X-Content-Hash': hash }),
          ...headers,
        }
      });
      const cache = (await caches?.open(cacheName)) ?? null;
      await cache?.put(key, response);
    }
    catch (e) { console.error('Failed to write to CacheStorage:', e); }
  };

  // private. one match for both the body and the stored source hash.
  const read = async (key) => {
    try {
      const cache = (await caches?.open(cacheName)) ?? null;
      const match = (await cache?.match(key))       ?? null;
      return match ? { content: await match.text(), hash: match.headers.get('X-Content-Hash') } : null;
    }
    catch (e) { return null; }
  };
  
  const pull = async (key, options = {}, knownHash = null) => {
    const {
      url          = key,
      fetchOptions = { cache: 'no-cache' },
      transform    = (raw) => raw,
      onPull, // consumed by getAndPull, discarded here
      ...setOptions
    } = options;
  
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) return null;
  
      const raw  = await response.text();
      const hash = getContentHash(raw);
      if (hash === knownHash) return null;
  
      const content = await transform(raw);
      await set(key, content, { ...setOptions, hash });
      return { content, hash };
    }
    catch (e) { console.warn('Pull failed:', key, e); return null; }
  };

  return {
    set,
    clear     : async ()    => (await caches?.delete(cacheName)) ?? false,
    get       : async (key) => (await read(key))?.content        ?? null,
    getOrPull : async (key, options = {}) => (await read(key) || await pull(key, options))?.content ?? null,
    
    delete : async (key) => {
      const cache = (await caches?.open(cacheName)) ?? null;
      return        (await cache?.delete(key))      ?? false;
    },

    async getAndPull (key, options = {}) {
      const entry  = await read(key);
      const cached = entry?.content ?? null;
    
      const pulled = (async () => {
        const fresh = await pull(key, options, entry?.hash ?? null);
        if (fresh) await options.onPull?.(fresh.content, { key, hash: fresh.hash, cached });
        return fresh?.content ?? null;
      })();
    
      return { cached, pulled };
    },

  };
}


// response layer. raw responses for the service worker, binary safe, no transform.
function createResponseCache (options = {}) {

  const { name = 'assets', namespace = 'aufbau' } = options;
  const cacheName = namespace + ':' + name;

  const put = async (cache, request, response) => {
    if (response.ok) await cache?.put(request, response.clone());
    return response;
  };

  return {

    clear : async () => (await caches?.delete(cacheName)) ?? false,

    delete : async (key) => {
      const cache = (await caches?.open(cacheName)) ?? null;
      return        (await cache?.delete(key))      ?? false;
    },

    async get (request) {
      const cache = (await caches?.open(cacheName)) ?? null;
      return        (await cache?.match(request))   ?? null;
    },

    async set (request, response) {
      const cache = (await caches?.open(cacheName)) ?? null;
      await put(cache, request, response);
    },

    async getOrPull (request) {
      const cache  = (await caches?.open(cacheName)) ?? null;
      const cached = (await cache?.match(request))   ?? null;
      if (cached) return cached;

      try { return await put(cache, request, await fetch(request)); }
      catch (e) { console.warn('Pull failed:', request.url ?? request, e); return null; }
    },
    
    async getAndPull (request, options = {}) {
      const { onPull = null } = options;

      const cache  = (await caches?.open(cacheName)) ?? null;
      const cached = (await cache?.match(request))   ?? null;

      const pulled = fetch(request)
        .then(async (response) => {
          if (!response.ok) return null;
          // etag comparison instead of body hashing, the payload may be binary
          if (cached && cached.headers.get('etag') !== response.headers.get('etag')) await onPull?.(request, response);
          return put(cache, request, response);
        })
        .catch((e) => { console.warn('Pull failed:', request.url ?? request, e); return null; });

      return { cached, pulled };
    },

  };
}

// :::::: SUGAR LAYER | two proxy levels: namespace -> cache -> key.

function createCacheProxy (options = {}) {

  const { namespace = 'aufbau', caches: defs = {} } = options;
  const config    = new Map(Object.entries(defs));
  const instances = new Map();

  // key access resolves to a value, never to the { cached, pulled } pair.
  // use the underlying method directly when you need both.
  const wrap = (name) => {
    const cache = createCache({ name, namespace });
    const conf  = config.get(name) ?? {};

    return new Proxy(cache, {

      get (target, prop) {
        if (typeof prop === 'symbol' || prop in target) return Reflect.get(target, prop);
        const opts = { ...conf, ...conf.keys?.[prop] };
        if (opts.strategy !== 'getAndPull') return target[opts.strategy ?? 'get'](prop, opts);
        return target.getAndPull(prop, opts).then(({ cached, pulled }) => cached ?? pulled);
      },

      set (target, prop, value) {
        if (value === null) target.delete(prop);
        else target.set(prop, value, { ...conf, ...conf.keys?.[prop] });
        return true;
      },

      deleteProperty (target, prop) { target.delete(prop); return true; },

    });
  };

  const instance = (name) => {
    if (!instances.has(name)) instances.set(name, wrap(name));
    return instances.get(name);
  };

  const drop = (name) => {
    instances.delete(name);
    return caches?.delete(namespace + ':' + name) ?? false;
  };

  const api = {
    // register or extend a cache definition after construction
    define (name, conf = {}) {
      config.set(name, { ...config.get(name), ...conf, keys: { ...config.get(name)?.keys, ...conf.keys } });
      instances.delete(name); // rebuild with the new config on next access
      return instance(name);
    },
    delete: drop,
    async clear () { await Promise.all([...config.keys(), ...instances.keys()].map(drop)); },
  };

  return new Proxy(api, {
    get (target, prop) {
      if (typeof prop === 'symbol' || prop in target) return Reflect.get(target, prop);
      return instance(prop);
    },
    set (target, prop, value) { if (value === null) drop(prop); return true; },
    deleteProperty (target, prop) { drop(prop); return true; },
  });
}

// :::::: EXPORTS

export { 
  createCache, 
  createResponseCache,
  createCacheProxy,
  getContentHash,
};

export default createCache;


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

getAndFetch        getOrFetch
getAndPull         getOrPull
getAndRefresh      getOrRefresh
getAndRevalidate   getOrRevalidate
getAndSync         getOrSync
getAndUpdate       getOrUpdate
*/

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
