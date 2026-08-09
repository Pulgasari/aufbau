// @aufbau/cache

import type { Cache } from '@bunker/cache';
import type { BunkerDB } from '@bunker/db';

/** The IndexedDB database every aufbau cache is backed by. */
export declare const db: BunkerDB;

/**
 * General purpose cache over an IndexedDB L2. Entries do not age by default —
 * pass a `ttl` at the call site when you want them to.
 */
export declare const cache: Cache;

/**
 * Compiled stylesheets, keyed by the hash of their source.
 *
 * Content addressing means an entry cannot go stale: a different source is a
 * different key. So there is no TTL here — the entry ceiling, not expiry, keeps the
 * database bounded.
 */
export declare const sheets: Cache;

/** The cache key a given ASS source compiles under. */
export declare function stylesheetKey(source: string): string;

/**
 * Compiles ASS to CSS once per distinct source, returning the cached result on
 * every later call.
 *
 * `compile` is a parameter rather than an import so this package does not drag
 * `@aufbau/stylesheet` in behind it.
 */
export declare function compileStylesheet(
  source: string,
  compile: (source: string) => string | Promise<string>,
): Promise<string>;

/** Enforces the entry ceilings and drops expired entries. Safe on an idle callback. */
export declare function prune(): Promise<number>;

export default cache;
