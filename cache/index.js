// @aufbau/cache
// @ts-self-types="./index.d.ts"

/*
  aufbau's caching preset. the engine is @bunker/cache; 
  what belongs to aufbau is the wiring — 
  one indexeddb database, one namespace per concern — 
  and the stylesheet cache, which is the reason this package exists at all.
*/

import { createCache }           from '@bunker/cache';
import { createDb }              from '@bunker/db';
import { createFiles }           from '@bunker/files';
import { createLogger, hashKey } from '@aufbau/js';

const NAMESPACE = 'aufbau';
const VERSION   = 1;

const log     = createLogger('aufbau-cache');
const onError = ({ error, key, operation }) => log.warn(`could not ${operation} "${key}":`, error);

export const db = createDb(NAMESPACE);

const driver = db.driver('kv');

/** general purpose. give entries a ttl at the call site, they do not age by default. */
export const cache = createCache({
  driver, onError,
  maxEntries : 512,
  namespace  : NAMESPACE,
  version    : VERSION,
});

// :::::: STYLESHEETS :::::::::::::::::::::::::::::::::::::::::::

/*
  compiled stylesheets, keyed by the hash of their source.

  content addressing means an entry can never go stale: a different source is a
  different key. so there is no ttl here — the entry ceiling, not expiry, is what
  keeps the database from growing forever.
*/
export const sheets = createCache({
  driver, onError,
  maxEntries : 64,
  namespace  : `${NAMESPACE}:sheets`,
  version    : VERSION,
});

export const stylesheetKey = (source) => hashKey(source);

/*
  compiles ass to css once per distinct source.

  the transform is pure, so a hit is always valid and a miss only ever happens the
  first time a given stylesheet is seen. `compile` stays a parameter rather than an
  import so this package does not drag @aufbau/stylesheet in behind it.
*/
export async function compileStylesheet (source, compile) {
  const key    = stylesheetKey(source);
  const cached = await sheets.get(key);
  if (cached !== null) return cached;

  const css = await compile(source);
  await sheets.set(key, css);
  return css;
}

// :::::: RESPONSES :::::::::::::::::::::::::::::::::::::::::::::

/*
  cachestorage rather than indexeddb, because what goes in here is meant to come
  back out as an http response.

  entries are real Response objects, so a service worker can hand one straight to
  respondWith and the browser's own pipelines survive the round trip — css is
  parsed by the css parser, font-display and unicode-range keep working. that is
  the whole reason this is not just another value in `cache` above.
*/

/** the exact cache name sw.js reads. the two are kept in step by hand, the same
    arrangement as BOOT_KEYS between @aufbau/store and boot.js. */
export const RESPONSE_CACHE = 'aufbau-stylesheets';

export const responses = createFiles({ name: RESPONSE_CACHE, onError });

/*
  hands a compiled stylesheet to the service worker.

  a worker never controls the navigation that registered it, so it cannot help the
  first visit — but from the second on it can answer the <link> straight from this
  cache. that keeps an ordinary render-blocking link and still resolves instantly,
  which is the one arrangement with no javascript on the critical path at all.

  the worker therefore never needs a compiler: the page has already done the work
  by the time the worker can intercept anything.
*/
export async function publishStylesheet (href, css) {
  return responses.put(href, new Response(css, {
    headers: { 'content-type': 'text/css; charset=utf-8' },
  }));
}

// :::::: MAINTENANCE :::::::::::::::::::::::::::::::::::::::::::

/** enforces the ceilings and drops expired entries. safe on an idle callback. */
export async function prune () {
  return (await cache.prune()) + (await sheets.prune());
}

export default cache;
