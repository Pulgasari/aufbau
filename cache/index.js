// @aufbau/cache
// @ts-self-types="./index.d.ts"

/*
  aufbau's caching preset. the engine is @bunker/cache; what belongs to aufbau is
  the wiring — one indexeddb database, one namespace per concern — and the
  stylesheet cache, which is the reason this package exists at all.
*/

import { createCache } from '@bunker/cache';
import { createDb } from '@bunker/db';
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

/** enforces the ceilings and drops expired entries. safe on an idle callback. */
export async function prune () {
  return (await cache.prune()) + (await sheets.prune());
}

export default cache;
