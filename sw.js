/* @aufbau/sw.js

the shared service worker core. a project drops a two-line sw.js of its own:

  importScripts('https://pulgasari.github.io/aufbau/sw.js');
  aufbauServiceWorker({ precache: ['./index.js'] });

and registers it WITHOUT type: 'module':

  navigator.serviceWorker.register(new URL('./sw.js', import.meta.url));

:::::: why a classic script, and why it imports nothing

a service worker has NO import map. import maps are bound to the Document in the
html standard and no browser implements a worker variant, so every bare specifier
in a module worker's graph fails to resolve and the worker never installs. that is
why this file uses no `import` at all — URLPattern, caches and fetch are native —
and why sharing happens through importScripts(), which performs no specifier
resolution whatsoever and simply takes a url.

the second reason is startup cost. the browser terminates an idle worker after
roughly 30 seconds and restarts it on the next event, re-evaluating its whole
graph every time. importing a kit here would mean 105 modules and 342 KB on each
of those restarts.

:::::: what it deliberately does NOT do

it does not compile .ass stylesheets, and it does not need to. a freshly
registered worker never controls the navigation that registered it, so by the time
this worker can intercept anything the page has already compiled its stylesheets
once and seeded them — see @aufbau/plugins/client. the worker only has to SERVE
them, and serving needs no compiler.

:::::: scope

`scope` decides which PAGES a worker controls, not which urls it may intercept. a
controlled page sends every request through its worker, cross-origin ones
included. so a worker at /docs/ covers everything /docs/ loads — but only pages
under /docs/. one worker per project, placed at that project's root.

note: loading this file from another origin needs CORS on the response. within one
origin — the usual case — there is nothing to arrange.
*/

self.aufbauServiceWorker = function aufbauServiceWorker (options = {}) {

  const {
    fonts     = true,
    modules   = true,
    precache  = [],
    stylesheets = true,
    version   = 'v1',
  } = options;

  // :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::

  const CACHE_FONTS   = `aufbau-fonts-${version}`;
  const CACHE_MODULES = `aufbau-modules-${version}`;

  /*
    NOT versioned, deliberately: the page writes compiled css into this exact cache
    through @aufbau/cache. the two names are a contract kept by hand, the same
    arrangement as BOOT_KEYS between @aufbau/store and boot.js.
  */
  const CACHE_SHEETS = 'aufbau-stylesheets';

  const KEEP = new Set([CACHE_FONTS, CACHE_MODULES, CACHE_SHEETS]);

  /*
    how long an entry is served without even asking. past it the stored copy still
    goes out immediately, with a conditional revalidation behind it.

    fonts are content-addressed by url in practice — a rebuild ships a new
    filename — so there is nothing to gain from asking about them often.
  */
  const TTL_FONT   = 30 * 24 * 60 * 60 * 1000;
  const TTL_MODULE = 60 * 60 * 1000;

  // cachestorage keeps no insertion time, so entries carry their own
  const HEADER_STORED = 'x-aufbau-stored';

  const REGEX_FONT   = /\.(otf|ttf|woff2?)$/i;
  const REGEX_MODULE = /\.m?js$/i;
  const REGEX_SHEET  = /\.(ass|aufbau\.css)$/i;

  // :::::: STORAGE :::::::::::::::::::::::::::::::::::::::::::::

  const ageOf = (response) => Date.now() - Number(response.headers.get(HEADER_STORED) ?? 0);

  /** a response's headers are immutable, so a stamped copy is rebuilt around its body */
  async function store (cache, request, response) {
    const body    = await response.clone().arrayBuffer();
    const headers = new Headers(response.headers);

    headers.set(HEADER_STORED, String(Date.now()));
    await cache.put(request, new Response(body, {
      headers,
      status     : response.status,
      statusText : response.statusText,
    }));
  }

  /** adds if-none-match / if-modified-since, so an unchanged file costs headers only */
  function conditional (request, cached) {
    if (!cached) return request;

    const headers  = new Headers(request.headers);
    const etag     = cached.headers.get('etag');
    const modified = cached.headers.get('last-modified');

    if (etag)     headers.set('if-none-match',     etag);
    if (modified) headers.set('if-modified-since', modified);

    return new Request(request, { headers });
  }

  // :::::: STRATEGIES ::::::::::::::::::::::::::::::::::::::::::

  /*
    the page owns compilation and seeds the cache, so a hit is the normal case and
    a miss only means "first visit". passing the miss through untouched is
    correct: plugins/client picks it up, compiles it and fills the cache.
  */
  async function serveStored (request, name) {
    const cache  = await caches.open(name);
    const cached = await cache.match(request);

    return cached ?? fetch(request);
  }

  /*
    cache-first would be wrong here. module and font urls in this project are not
    content-addressed, so a cache-first entry would never be replaced and the user
    would sit on an old build forever.
  */
  async function staleWhileRevalidate (event, request, { name, ttl }) {
    const cache  = await caches.open(name);
    const cached = await cache.match(request);

    if (cached && ageOf(cached) < ttl) return cached;

    const revalidate = async () => {
      const response = await fetch(conditional(request, cached));

      // unchanged: the stored body stands, only its age needs refreshing. re-read
      // from the cache rather than reusing `cached`, whose body the caller may
      // already be consuming — clone() only works while a body is untouched.
      if (response.status === 304 && cached) {
        const stored = await cache.match(request);
        if (stored) await store(cache, request, stored);
        return cached;
      }

      if (response.ok) await store(cache, request, response);
      return response;
    };

    // a stale copy goes out now and the refresh runs behind it. waitUntil keeps
    // the worker alive long enough to finish writing, and an offline failure
    // leaves the stale copy in place — which is the point of having served it.
    if (cached) {
      event.waitUntil(revalidate().catch(() => {}));
      return cached;
    }

    return revalidate();
  }

  // :::::: ROUTING :::::::::::::::::::::::::::::::::::::::::::::

  /*
    fonts match on any origin: google fonts serves them cors-enabled, so the
    responses are not opaque and cache fine. modules and stylesheets stay on our
    own origin — esm.sh and jsdelivr already ship long-lived immutable urls and the
    browser's http cache handles those better than we would.
  */
  function route (url) {
    if (fonts && REGEX_FONT.test(url.pathname)) return { name: CACHE_FONTS, ttl: TTL_FONT };

    if (url.origin !== self.location.origin) return null;

    if (stylesheets && REGEX_SHEET .test(url.pathname)) return { name: CACHE_SHEETS,  stored: true };
    if (modules     && REGEX_MODULE.test(url.pathname)) return { name: CACHE_MODULES, ttl: TTL_MODULE };

    return null;
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  self.addEventListener('install', (event) => {
    // do not sit in `waiting` until every tab using the old worker is closed
    self.skipWaiting();

    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_MODULES);

      // cache.addAll is atomic — a single 404 fails the whole install — so each
      // entry is fetched on its own and a miss is left for later. stored through
      // store() rather than cache.add() so the ttl stamp is present and the first
      // use does not immediately revalidate.
      await Promise.all(precache.map(async (path) => {
        try {
          const request  = new Request(new URL(path, self.location.href).href);
          const response = await fetch(request);
          if (response.ok) await store(cache, request, response);
        } catch (error) {
          // a precache miss is never worth failing an install over
        }
      }));
    })());
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith('aufbau-') && !KEEP.has(name))
                             .map(name => caches.delete(name)));

      // lets the browser start a navigation request in parallel with worker boot,
      // so a cold worker does not sit in front of the html
      try { await self.registration.navigationPreload?.enable(); } catch (error) {}

      // take over clients that are already open, including the one that
      // registered this worker
      await self.clients.claim();
    })());
  });

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const match = route(new URL(request.url));

    /*
      NOT ours: return without respondWith and the browser keeps its own optimised
      network path. this is the whole discipline of a fetch handler — the moment
      respondWith is called, every request is routed through javascript and has to
      wait for the worker to boot when it is not already running, even the ones
      that only fall through to fetch().

      the decision must therefore be synchronous. an await before this point would
      already be too late, because respondWith is only valid in the same tick.
    */
    if (!match) return;

    event.respondWith(match.stored
      ? serveStored(request, match.name)
      : staleWhileRevalidate(event, request, match));
  });

};
