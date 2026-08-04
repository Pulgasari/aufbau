// @aufbau/cache

// highest code unit, used as the upper bound of a prefix range scan
const RANGE_END = '\uffff';

export class AufbauCache {

  constructor (options = {}) {
    this.dbName     = options.name || 'aufbau-cache';
    this.defaultTTL = options.ttl || null;
    this.memory     = new Map();
    this.dbPromise  = this._initDB();
  }

  async _initDB () {
    if (typeof indexedDB === 'undefined') return null;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => { request.result.createObjectStore('kv'); };
      request.onsuccess       = () => resolve(request.result);
      request.onerror         = () => reject(request.error);
    });
  }

  // reads the stored entry including its expire stamp, without the expiry
  // side effects of get(). needed by prune, which must inspect before deleting.
  async _raw (key) {
    const db = await this.dbPromise;
    if (!db) return this.memory.get(key) ?? null;

    return new Promise((resolve) => {
      const request = db.transaction('kv', 'readonly').objectStore('kv').get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror   = () => resolve(null);
    });
  }

  async get (key) {
    // l1 memory lookup
    if (this.memory.has(key)) {
      const entry = this.memory.get(key);
      if (!entry.expire || entry.expire > Date.now()) return entry.value;
      this.memory.delete(key);
    }

    // l2 indexeddb lookup
    const db = await this.dbPromise;
    if (!db) return null;

    return new Promise((resolve) => {
      const request = db.transaction('kv', 'readonly').objectStore('kv').get(key);

      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) return resolve(null);

        if (entry.expire && entry.expire <= Date.now()) {
          this.delete(key);
          return resolve(null);
        }

        // populate l1 for faster subsequent reads
        this.memory.set(key, entry);
        resolve(entry.value);
      };
      request.onerror = () => resolve(null);
    });
  }

  async set (key, value, ttl = this.defaultTTL) {
    const entry = { value, expire: ttl ? Date.now() + ttl : null };
    this.memory.set(key, entry);

    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const request = db.transaction('kv', 'readwrite').objectStore('kv').put(entry, key);
      request.onsuccess = () => resolve();
      request.onerror   = () => reject(request.error);
    });
  }

  async delete (key) {
    this.memory.delete(key);
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').delete(key);
      tx.oncomplete = () => resolve();
    });
  }

  // keys are strings and indexeddb sorts them lexicographically, so a prefix
  // scan is a plain bound range and needs no separate index.
  async keys (prefix = '') {
    const db = await this.dbPromise;
    if (!db) return [...this.memory.keys()].filter(key => key.startsWith(prefix));

    return new Promise((resolve) => {
      const request = db.transaction('kv', 'readonly')
        .objectStore('kv')
        .getAllKeys(IDBKeyRange.bound(prefix, prefix + RANGE_END));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror   = () => resolve([]);
    });
  }

  // entries expire lazily on read, so keys nobody reads anymore are never
  // cleaned up on their own. prune sweeps them actively.
  async prune (prefix = '') {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.memory) {
      if (key.startsWith(prefix) && entry.expire && entry.expire <= now) this.memory.delete(key);
    }

    const db = await this.dbPromise;
    if (!db) return removed;

    for (const key of await this.keys(prefix)) {
      const entry = await this._raw(key);
      if (entry?.expire && entry.expire <= now) {
        await this.delete(key);
        removed++;
      }
    }
    return removed;
  }

  async clear () {
    this.memory.clear();
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').clear();
      tx.oncomplete = () => resolve();
    });
  }
}

export const cache = new AufbauCache();
export default cache;
