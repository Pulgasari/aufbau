// bunker.js

/*

os = objectStore
rq = request
tx = transaction

-- parameters:
e = event
k = key
i = index
r = range
s = store
t = table OR ...tables
v = value

// 3. Range counting (Advanced)
// Count how many keys start between 'A' and 'M'
const range = IDBKeyRange.bound('A', 'M');
const count = await bunker.users.count(range);

*/


export class BunkerDB {
  #db = null; #dbName; #tables = new Set(); #queue = Promise.resolve();

  constructor (dbName) {
    this.#dbName = dbName;

    return new Proxy(this, {
      get: (target, prop) => {
        // 1. Pass symbols straight through
        if (typeof prop === 'symbol') return target[prop];
        // 2. Prevent async/await from treating the Proxy as a Promise
        if (prop === 'then') return undefined;
        // 3. Bind class methods to the original target to preserve private field access
        if (prop in target) {
          const value = target[prop];
          return typeof value === 'function' ? value.bind(target) : value;
        }
        // 4. Dynamic table proxy fallback
        return this.#createTableProxy(prop);
      }
    });
  }

  // --- Internal Helpers ---

  /** Serializes every connection change: only one open/upgrade runs at a time. */
  #lock (fn) {
    let run = this.#queue.then(fn, fn);
    this.#queue = run.catch(() => {});
    return run;
  }

  #syncTables (db) {
    this.#tables = new Set(db.objectStoreNames);
    // Never block another tab's upgrade
    db.onversionchange = () => { db.close(); if (this.#db === db) this.#db = null; };
    return db;
  }

  /** version=null -> open at whatever version is stored on disk (no upgrade). */
  #open (version = null, upgradeFn = null) {
    if (this.#db) { this.#db.close(); this.#db = null; }

    return new Promise((resolve, reject) => {
      let rq = version ? indexedDB.open(this.#dbName, version) : indexedDB.open(this.#dbName);
      rq.onupgradeneeded = e => upgradeFn?.(e.target.result, rq.transaction);
      rq.onsuccess       = () => resolve(this.#db = this.#syncTables(rq.result));
      rq.onerror         = () => reject(rq.error);
      rq.onblocked       = () => reject(new Error(`BunkerDB "${this.#dbName}": upgrade blocked by another connection`));
    });
  }

  /** Ensures a connection exists. Must be called inside #lock. */
  async #connect () {
    return this.#db ?? this.#open();
  }

  async #getDB (table = null) {
    // Fast path: connection is live and the store is known
    if (this.#db && (!table || this.#tables.has(table))) return this.#db;

    return this.#lock(async () => {
      await this.#connect();
      // Re-check inside the lock: a queued call may already have created it
      if (!table || this.#tables.has(table)) return this.#db;
      return this.#open(this.#db.version + 1, db => db.createObjectStore(table));
    });
  }

  #createTableProxy (table) {
    let api = ['get', 'set', 'has', 'count', 'delete', 'clear', 'getAll', 'find', 'toggle'];
    let proxyObj = api.reduce((acc, method) => {
      acc[method] = (...args) => this[method](table, ...args);
      return acc;
    }, { drop: () => this.dropTable(table) });

    return new Proxy( proxyObj, {
      get: (target, key) => key in target ? target[key] : this.get(table, key),
      set: (target, key, value) => { this.set(table, key, value); return true; }
    });
  }

  /**
   * The "Engine": Handles transactions and requests.
   */
  async task (table, mode, callback) {
    let db = await this.#getDB(table);
    return new Promise((resolve, reject) => {
      let tx = db.transaction(table, mode);
      let rx = callback( tx.objectStore(table), resolve, reject );
      if (rx instanceof IDBRequest) {
        rx.onsuccess = () => resolve(rx.result ?? true);
        rx.onerror   = () => reject(rx.error);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror    = () => reject(tx.error);
    });
  }

  // --- Schema ---
  async setup (schema) {
    return this.#lock(async () => {
      await this.#connect();
      if (!this.#needsUpgrade(schema)) return this.#db;

      return this.#open(this.#db.version + 1, (db, tx) => {
        for (let [name, opt] of Object.entries(schema)) {
          let store = db.objectStoreNames.contains(name)
            ? tx.objectStore(name)
            : db.createObjectStore(name, { keyPath: opt.keyPath, autoIncrement: opt.autoIncrement });

          opt.indexes?.forEach(i => !store.indexNames.contains(i) && store.createIndex(i, i));
        }
      });
    });
  }

  /** Idempotency check so setup() on every page load doesn't bump the version. */
  #needsUpgrade (schema) {
    let names = Object.keys(schema);
    if (names.some(n => !this.#tables.has(n))) return true;

    let withIdx = names.filter(n => schema[n].indexes?.length);
    if (!withIdx.length) return false;

    let tx = this.#db.transaction(withIdx, 'readonly');
    return withIdx.some(n => {
      let store = tx.objectStore(n);
      return schema[n].indexes.some(i => !store.indexNames.contains(i));
    });
  }

  async dropTable (table) {
    return this.#lock(async () => {
      await this.#connect();
      if (!this.#tables.has(table)) return this.#db;
      return this.#open(this.#db.version + 1, db => db.deleteObjectStore(table));
    });
  }

  // --- API Methods ---
  async clear  (...T)  { for (let table of T) await this.task(table, 'readwrite', s => s.clear()); }
  async has    (t,k)   { return (await this.count(t,k)) > 0; }
  async count  (t,r)   { return this.task( t, 'readonly',  s => s.count(r)  )}
  async delete (t,k)   { return this.task( t, 'readwrite', s => s.delete(k) )}
  async get    (t,k)   { return this.task( t, 'readonly',  s => s.get(k)    )}
  async set    (t,k,v) { return this.task( t, 'readwrite', s => s.put(v,k)  )}
  async toggle (t,k)   {
    return this.task(t, 'readwrite', (s, resolve, reject) => {
      let rx = s.get(k); // get current value
      rx.onsuccess = () => {
        let newValue   = !rx.result; // negate current value
        let putRequest = s.put(newValue, k);
        // resolve with the NEW value
        putRequest.onsuccess = () => resolve(newValue);
        putRequest.onerror   = () => reject(putRequest.error);
      };
      rx.onerror = () => reject(rx.error);
    });
  }
  //
  async getAll (t) {
    return this.task(t, 'readonly', (s, resolve, reject) => {
      let rx = s.openCursor(), res = {};
      rx.onsuccess = e => {
        let cursor = e.target.result;
        if (cursor) { res[cursor.key] = cursor.value; cursor.continue(); }
        else resolve(res);
      };
      rx.onerror = () => reject(rx.error);
    });
  }
  async find (t, idx, val) {
    return this.task(t, 'readonly', (s, resolve, reject) => {
      let rx = s.index(idx).getAll(val);
      rx.onsuccess = () => resolve(rx.result);
      rx.onerror   = () => reject(rx.error);
    });
  }
}
export default BunkerDB;
