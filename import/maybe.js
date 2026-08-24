// ============================================================
// 2. ZENTRALISIERTE FEHLERBEHANDLUNG
// ============================================================

class ImportError extends Error {
  constructor(message, path, originalError = null) {
    super(message);
    this.name = 'ImportError';
    this.path = path;
    this.cause = originalError;
    this.timestamp = new Date().toISOString();
    
    // Stack-Trace erhalten
    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

class NetworkError extends ImportError {
  constructor(path, status, statusText) {
    super(`HTTP ${status}: ${statusText}`, path);
    this.status = status;
    this.statusText = statusText;
  }
}

class ParseError extends ImportError {
  constructor(path, format, originalError) {
    super(`Failed to parse ${format}`, path, originalError);
    this.format = format;
  }
}

async function safeImport(handler, path, options) {
  try {
    const result = await handler(path, options);
    return result;
  } catch (error) {
    // Bestehenden ImportError durchreichen
    if (error instanceof ImportError) throw error;
    
    // Spezifische Fehler erkennen
    if (error.name === 'SyntaxError') {
      const ext = extensionOf(path);
      throw new ParseError(path, ext, error);
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new NetworkError(path, 0, 'Network error');
    }
    
    // Generischer Fehler
    throw new ImportError(`Failed to import "${path}"`, path, error);
  }
}

// Verwendung:
export async function importFile(path, options) {
  // ... bestehender Code ...
  return safeImport(handler, path, options);
}

// ============================================================
// 3. CACHING-LOGIK AUSGELAGERT
// ============================================================

class CacheManager {
  constructor({ driver, onError, max, maxEntries, namespace, version } = {}) {
    this.driver = driver;
    this.onError = onError || (({ error, key, operation }) => 
      console.warn(`could not ${operation} "${key}":`, error)
    );
    this.max = max || 256;
    this.maxEntries = maxEntries || 512;
    this.namespace = namespace || 'aufbau';
    this.version = version || 1;
    this.metrics = { hits: 0, misses: 0, sets: 0, prunes: 0 };
  }

  async entry(key) {
    if (!this.driver) return { state: 'miss' };
    
    try {
      const entry = await this.driver.get(key);
      if (!entry) {
        this.metrics.misses++;
        return { state: 'miss' };
      }
      
      // TTL-Check
      if (entry.expires && entry.expires < Date.now()) {
        await this.driver.delete(key);
        this.metrics.misses++;
        return { state: 'expired' };
      }
      
      this.metrics.hits++;
      return { state: 'fresh', value: entry.value };
    } catch (error) {
      this.onError({ error, key, operation: 'get' });
      return { state: 'miss' };
    }
  }

  async set(key, value, { ttl } = {}) {
    if (!this.driver) return false;
    
    try {
      const entry = {
        value,
        expires: ttl ? Date.now() + ttl : undefined,
        timestamp: Date.now()
      };
      
      await this.driver.set(key, entry);
      this.metrics.sets++;
      
      // Größenprüfung
      if (this.metrics.sets % 10 === 0) {
        await this.prune();
      }
      
      return true;
    } catch (error) {
      this.onError({ error, key, operation: 'set' });
      return false;
    }
  }

  async prune(prefix = '') {
    if (!this.driver) return;
    
    try {
      const keys = await this.driver.keys();
      const expired = [];
      const byPrefix = [];
      
      for (const key of keys) {
        if (prefix && !key.startsWith(prefix)) continue;
        
        if (key.startsWith(prefix) && !prefix) continue;
        byPrefix.push(key);
        
        const entry = await this.driver.get(key);
        if (entry?.expires && entry.expires < Date.now()) {
          expired.push(key);
        }
      }
      
      // Lösche abgelaufene Einträge
      for (const key of expired) {
        await this.driver.delete(key);
      }
      
      // Wenn zu viele Einträge, lösche die ältesten
      if (byPrefix.length > this.maxEntries) {
        const entries = await Promise.all(
          byPrefix.map(async key => ({
            key,
            entry: await this.driver.get(key)
          }))
        );
        
        entries
          .filter(e => e.entry)
          .sort((a, b) => (a.entry.timestamp || 0) - (b.entry.timestamp || 0))
          .slice(0, byPrefix.length - this.maxEntries)
          .forEach(e => this.driver.delete(e.key));
      }
      
      this.metrics.prunes++;
    } catch (error) {
      this.onError({ error, operation: 'prune' });
    }
  }

  isCacheable(value) {
    if (!value || typeof value !== 'object') {
      return typeof value !== 'function';
    }
    
    if (typeof Node !== 'undefined' && value instanceof Node) return false;
    if (typeof CSSStyleSheet !== 'undefined' && value instanceof CSSStyleSheet) return false;
    
    // Prüfe auf Funktionen in Objekten
    return !Object.values(value).some(member => typeof member === 'function');
  }

  getMetrics() {
    return { ...this.metrics };
  }

  clear() {
    this.metrics = { hits: 0, misses: 0, sets: 0, prunes: 0 };
  }
}

// Cache-Instanz erstellen
const cache = new CacheManager({
  driver: BunkerDB.isSupported() ? createDb(namespace).driver('kv') : undefined,
  onError,
  max: 256,
  maxEntries: 512,
  namespace,
  version: CACHE_VERSION
});

// ============================================================
// 6. MIME-TYPE MAPPING
// ============================================================

const mimeTypes = {
  // Textformate
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.env': 'text/plain',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.ini': 'text/plain',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.json5': 'application/json',
  '.jsonc': 'application/json',
  '.jsonl': 'application/jsonl',
  '.jsx': 'text/jsx',
  '.less': 'text/css',
  '.md': 'text/markdown',
  '.mjs': 'application/javascript',
  '.ndjson': 'application/jsonl',
  '.sass': 'text/scss',
  '.scss': 'text/scss',
  '.svg': 'image/svg+xml',
  '.text': 'text/plain',
  '.toml': 'text/toml',
  '.ts': 'text/typescript',
  '.tsv': 'text/tab-separated-values',
  '.tsx': 'text/tsx',
  '.txt': 'text/plain',
  '.vert': 'text/plain',
  '.wasm': 'application/wasm',
  '.wgsl': 'text/wgsl',
  '.xml': 'text/xml',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  
  // Fallbacks
  '.frag': 'text/plain',
  '.glsl': 'text/plain'
};

function getMimeType(path) {
  const ext = extensionOf(path);
  const key = `.${ext}`;
  return mimeTypes[key] || 'text/plain';
}

// Verbesserte fetchText-Funktion mit MIME-Types
async function fetchText(path, options = {}) {
  const mimeType = getMimeType(path);
  
  const response = await fetch(path, {
    ...options.fetchOptions,
    headers: {
      'Accept': mimeType,
      ...options.fetchOptions?.headers
    }
  });
  
  if (!response.ok) {
    throw new NetworkError(path, response.status, response.statusText);
  }
  
  // Prüfe ob der Content-Type passt
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes(mimeType)) {
    console.warn(`[@aufbau/import] Expected ${mimeType}, got ${contentType} for ${path}`);
  }
  
  return response.text();
}

// ============================================================
// 9. MEMOIZATION FÜR RESOLVER
// ============================================================

class Memoizer {
  constructor({ maxSize = 100, ttl = 3600000 } = {}) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  memoize(fn) {
    return async (...args) => {
      const key = JSON.stringify(args);
      const cached = this.cache.get(key);
      
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }
      
      const result = await fn(...args);
      
      // Cache-Größe begrenzen
      if (this.cache.size >= this.maxSize) {
        const oldest = [...this.cache.entries()]
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        this.cache.delete(oldest[0]);
      }
      
      this.cache.set(key, {
        value: result,
        expires: Date.now() + this.ttl,
        timestamp: Date.now()
      });
      
      return result;
    };
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// Memoized locate-Funktion
const resolverMemoizer = new Memoizer({ maxSize: 50, ttl: 600000 }); // 10 Minuten
const locateMemoized = resolverMemoizer.memoize(locate);

// Verbesserte locate-Funktion
function locate(name) {
  // Prüfe zuerst Override
  const override = overrides.get(name);
  if (isString(override)) return override;

  const specifier = registry[name];
  if (!specifier) {
    throw new Error(`[@aufbau/import] no vendor registered under "${name}".`);
  }

  // Versuche Import Map
  try {
    const hit = import.meta.resolve(bare(specifier));
    if (hit) return hit;
  } catch {}

  // Fallback zu CDN
  return cdn + specifier;
}

// ============================================================
// 11. RETRY-LOGIK
// ============================================================

async function fetchWithRetry(path, options = {}, retries = 3) {
  let lastError;
  const backoff = (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Timeout für jeden Versuch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch(path, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response;
        }
        
        lastError = new NetworkError(path, response.status, response.statusText);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;
      
      // Kein Retry bei bestimmten Fehlern
      if (error.name === 'AbortError') {
        throw new ImportError(`Request timeout for "${path}"`, path, error);
      }
      
      if (error.message.includes('403') || error.message.includes('401')) {
        throw error;
      }
    }
    
    // Warte vor dem nächsten Versuch
    if (attempt < retries - 1) {
      const delay = backoff(attempt);
      console.warn(`[@aufbau/import] Retry ${attempt + 1}/${retries} for "${path}" in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new ImportError(`Failed after ${retries} retries`, path);
}

// Aktualisierte fetchText-Funktion
async function fetchText(path, options = {}) {
  const response = await fetchWithRetry(path, options.fetchOptions, options.retries ?? 3);
  return response.text();
}

// ============================================================
// 12. URL-VALIDIERUNG
// ============================================================

function validateUrl(path, base = document?.baseURI) {
  try {
    const url = new URL(path, base);
    
    // Nur http/https erlauben
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Unsafe protocol "${url.protocol}" for "${path}"`);
    }
    
    // Keine Benutzerinformationen
    if (url.username || url.password) {
      throw new Error(`Credentials not allowed in URL: "${path}"`);
    }
    
    // Keine Ports außer Standard
    const allowedPorts = [80, 443, null, undefined];
    if (!allowedPorts.includes(url.port) && url.port !== '') {
      console.warn(`[@aufbau/import] Non-standard port ${url.port} for "${path}"`);
    }
    
    // Optional: Blocklist für bestimmte Domains
    const blockedDomains = ['localhost', '127.0.0.1'];
    if (blockedDomains.includes(url.hostname) && !options?.allowLocal) {
      throw new Error(`Localhost not allowed: "${path}"`);
    }
    
    return url;
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError(`Invalid URL: "${path}"`, path, error);
  }
}

// Verbesserte cacheIdentity mit Validierung
function cacheIdentity(path) {
  if (typeof document === 'undefined') {
    return validateUrl(path, 'http://localhost/').href;
  }
  
  const url = validateUrl(path, document.baseURI);
  return url.href;
}

// ============================================================
// 20. PERFORMANCE-METRIKEN
// ============================================================

class PerformanceMetrics {
  constructor() {
    this.imports = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    this.startTime = Date.now();
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
    this.startTime = Date.now();
  }

  disable() {
    this.enabled = false;
  }

  measureImport(path, handler) {
    if (!this.enabled) return handler();
    
    const start = performance.now();
    const id = cacheIdentity(path);
    
    return handler()
      .then(result => {
        const duration = performance.now() - start;
        this.imports.set(id, {
          path,
          duration,
          timestamp: Date.now(),
          success: true,
          size: this.estimateSize(result)
        });
        return result;
      })
      .catch(error => {
        this.errors++;
        throw error;
      });
  }

  estimateSize(value) {
    try {
      const str = JSON.stringify(value);
      return str.length;
    } catch {
      return 0;
    }
  }

  recordCacheHit() {
    if (this.enabled) this.cacheHits++;
  }

  recordCacheMiss() {
    if (this.enabled) this.cacheMisses++;
  }

  getReport() {
    const total = this.imports.size;
    const successful = [...this.imports.values()].filter(i => i.success).length;
    const avgDuration = this.getAverageDuration();
    const totalSize = [...this.imports.values()]
      .reduce((sum, i) => sum + (i.size || 0), 0);
    
    return {
      totalImports: total,
      successful: successful,
      failed: this.errors,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheRatio: total > 0 ? this.cacheHits / (this.cacheHits + this.cacheMisses) : 0,
      averageDuration: avgDuration,
      totalSize: totalSize,
      uptime: Date.now() - this.startTime,
      slowestImports: this.getSlowestImports(5),
      largestImports: this.getLargestImports(5),
      timestamp: new Date().toISOString()
    };
  }

  getAverageDuration() {
    const durations = [...this.imports.values()]
      .filter(i => i.success)
      .map(i => i.duration);
    return durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
  }

  getSlowestImports(n = 5) {
    return [...this.imports.values()]
      .filter(i => i.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, n)
      .map(i => ({ path: i.path, duration: i.duration }));
  }

  getLargestImports(n = 5) {
    return [...this.imports.values()]
      .filter(i => i.success && i.size)
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, n)
      .map(i => ({ path: i.path, size: i.size }));
  }

  clear() {
    this.imports.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
  }
}

// Globales Metrics-Objekt
const metrics = new PerformanceMetrics();

// Integration in die Hauptfunktion
export async function importFile(path, options) {
  options = toOptions(options);
  
  // Metrics aktivieren
  if (options.collectMetrics) {
    metrics.enable();
  }

  const extension = extensionOf(path);
  const handler = extensionMap[extension];
  if (!handler) {
    throw new Error(`[@aufbau/import] the file extension .${extension} is not supported.`);
  }

  const [resource, query = ''] = cacheIdentity(path).split(/[?#]/);
  const fingerprint = serializeOptions(options);
  const useCache = options.useCache !== false && fingerprint !== null;
  const prefix = `import:v${CACHE_VERSION}:${resource}:`;
  const cacheKey = `${prefix}${query}:${fingerprint}`;

  if (useCache) {
    const hit = await cache.entry(cacheKey);
    if (hit.state === 'fresh') {
      metrics.recordCacheHit();
      return hit.value;
    }
    metrics.recordCacheMiss();
  }

  // Mit Metrics messen
  const result = await metrics.measureImport(path, () => handler(path, options));

  if (useCache && cache.isCacheable(result)) {
    try {
      await cache.set(cacheKey, result, { ttl: options.ttl ?? defaultTTL });
      cache.prune(prefix).catch(() => {});
    } catch (e) {
      console.warn(`[@aufbau/import] could not cache "${path}":`, e);
    }
  }

  return result;
}

// ============================================================
// ZUSÄTZLICH: KONFIGURATION FÜR METRICS
// ============================================================

// Erweiterte configure-Funktion
export function configure({ cdn: url, modules, ttl, metrics: enableMetrics, debug } = {}) {
  if (url) cdn = url.endsWith('/') ? url : url + '/';
  if (ttl !== undefined) defaultTTL = ttl;
  if (modules) {
    for (const [name, value] of Object.entries(modules)) {
      overrides.set(name, value);
    }
  }
  
  if (enableMetrics) {
    metrics.enable();
  }
  
  if (debug) {
    console.log('[@aufbau/import] Configuration:', { cdn, ttl, modules: Object.keys(modules || {}) });
  }
}

// Export für externe Nutzung
export function getMetrics() {
  return metrics.getReport();
}

export function clearMetrics() {
  metrics.clear();
}

// Beispiel für die Nutzung:
/*
import { importFile, configure, getMetrics } from './import.js';

// Konfiguration mit Metrics
configure({
  cdn: 'https://cdn.jsdelivr.net/esm/',
  metrics: true,
  debug: true
});

// Import mit Metrics
const data = await importFile('./data.json', { 
  collectMetrics: true,
  retries: 2 
});

// Metrics abrufen
console.log(getMetrics());

// Cache-Status
console.log(cache.getMetrics());
*/
