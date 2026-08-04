// @aufbau/cache

export interface AufbauCacheOptions {
  /** IndexedDB database name. Defaults to `aufbau-cache`. */
  name?: string;
  /** Default time-to-live in milliseconds applied by `set()`. `null` means no expiry. */
  ttl?: number | null;
}

export interface AufbauCacheEntry<T = unknown> {
  value: T;
  /** Absolute expiry timestamp in milliseconds, or `null` when the entry never expires. */
  expire: number | null;
}

export declare class AufbauCache {
  constructor(options?: AufbauCacheOptions);

  readonly dbName: string;
  readonly defaultTTL: number | null;
  /** L1 in-memory layer. Exposed for inspection; prefer the public methods. */
  readonly memory: Map<string, AufbauCacheEntry>;
  readonly dbPromise: Promise<IDBDatabase | null>;

  /**
   * Reads through L1 memory, then L2 IndexedDB.
   * Resolves to `null` on a miss or when the entry has expired.
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Writes to both layers. Omitting `ttl` falls back to the instance default.
   * Values must be structured-cloneable.
   */
  set<T = unknown>(key: string, value: T, ttl?: number | null): Promise<void>;

  /** Removes a key from both layers. */
  delete(key: string): Promise<void>;

  /**
   * Lists all keys starting with `prefix`. Backed by a bound range scan,
   * so no separate index is required.
   */
  keys(prefix?: string): Promise<string[]>;

  /**
   * Actively removes expired entries under `prefix`. Entries otherwise only
   * expire lazily on read, so keys nobody reads are never cleaned up.
   * Resolves to the number of entries removed from L2.
   */
  prune(prefix?: string): Promise<number>;

  /** Empties both layers. */
  clear(): Promise<void>;
}

/** Shared singleton instance backed by the `aufbau-cache` database. */
export declare const cache: AufbauCache;

export default cache;
