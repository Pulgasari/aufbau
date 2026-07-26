// @aufbau/cache

/**
 * @typedef {Object} CacheOptions
 * @property {string} [name='aufbau-cache'] - Name des IndexedDB Storage
 * @property {number} [ttl] - Standard-Ablaufzeit in Millisekunden
 */

export class AufbauCache {
  /**
   * @param {CacheOptions} [options]
   */
  constructor (options = {}) {
    this.dbName     = options.name || 'aufbau-cache';
    this.defaultTTL = options.ttl || null;
    this.memory     = new Map();
    this.dbPromise  = this._initDB();
  }

  async _initDB() {
    if (typeof indexedDB === 'undefined') return null;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('kv');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }

  /**
   * Liest einen Wert (L1 Memory -> L2 IndexedDB)
   * @template T
   * @param {string} key
   * @returns {Promise<T|null>}
   */
  async get(key) {
    // 1. L1 Memory Lookup
    if (this.memory.has(key)) {
      const entry = this.memory.get(key);
      if (!entry.expire || entry.expire > Date.now()) {
        return entry.value;
      }
      this.memory.delete(key);
    }

    // 2. L2 IndexedDB Lookup
    const db = await this.dbPromise;
    if (!db) return null;

    return new Promise((resolve) => {
      const tx    = db.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const req   = store.get(key);

      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);

        if (entry.expire && entry.expire <= Date.now()) {
          this.delete(key);
          return resolve(null);
        }

        // Cache in L1 nachladen
        this.memory.set(key, entry);
        resolve(entry.value);
      };
      req.onerror = () => resolve(null);
    });
  }

  /**
   * Speichert einen Wert im Cache
   * @param {string} key
   * @param {any} value
   * @param {number} [ttl] - TTL in ms
   */
  async set (key, value, ttl = this.defaultTTL) {
    const expire = ttl ? Date.now() + ttl : null;
    const entry = { value, expire };

    // L1 Update
    this.memory.set(key, entry);

    // L2 Update
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise ((resolve, reject) => {
      const tx    = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      const req   = store.put(entry, key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /**
   * Löscht einen Schlüssel aus allen Layer-Stufen
   * @param {string} key
   */
  async delete (key) {
    this.memory.delete(key);
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve) => {
      const tx    = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      store.delete(key);
      tx.oncomplete = () => resolve();
    });
  }

  /**
   * Leert den gesamten Cache
   */
  async clear () {
    this.memory.clear();
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve) => {
      const tx    = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      store.clear();
      tx.oncomplete = () => resolve();
    });
  }
}

// Singleton Default-Instanz für globale Nutzung
export const cache = new AufbauCache();
