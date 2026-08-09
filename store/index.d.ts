// @aufbau/store

import type { Storage } from '@bunker/storage';

/** Survives the tab. Themes, skins, control values. */
export declare const store: Storage;

/** Dies with the tab. */
export declare const session: Storage;

/**
 * Compiled CSS, keyed by href, in its own namespace and stored as raw text.
 *
 * The boot path reads a whole stylesheet synchronously before the first paint, so
 * it must not pay for the quoting and escaping JSON would add to a value that is
 * already a string.
 */
export declare const sheets: Storage;

/**
 * Which stylesheets a page uses, keyed by pathname.
 *
 * `boot.js` runs before the `<link>` elements exist — that is the whole point — so
 * it cannot discover them from the DOM. This is how it knows what to inject, and in
 * which order.
 */
export declare const pages: Storage;

/**
 * The exact key prefixes `boot.js` reads. It is a standalone classic script and
 * cannot import any of this, so the two are kept in step by hand.
 */
export declare const BOOT_KEYS: {
  pages: string;
  sheets: string;
};

export interface PersistTarget {
  key: string;
  store: Storage;
}

/**
 * Resolves a control's `persist` attribute to a store and a key.
 *
 * ```
 * persist                  local,   key from name or id
 * persist="session"        session, key from name or id
 * persist="theme"          local,   key "theme"
 * persist="session:theme"  session, key "theme"
 * ```
 *
 * `null` when there is nothing to store under, which is not an error: a control can
 * carry `persist` before it has been given a name.
 */
export declare function resolvePersist(
  spec: string | null | undefined,
  context?: { id?: string; name?: string | null },
): PersistTarget | null;

/** Drops what an older version of aufbau left behind. Cheap, worth calling at boot. */
export declare function sweep(): number;

export default store;
