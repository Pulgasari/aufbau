/* flow-engine.js */

// Functional helper methods for curried property manipulation
const ensurePrefix = (prefix) => (str) => str.startsWith(prefix) ? str : prefix + str;
const ensureDashed = ensurePrefix('--flow-');

const setToken = (el) => (k, v) => el.style.setProperty(ensureDashed(k), v);
const entries = Object.entries;

// In-Memory Cache Store (Fastest Layer)
const memoryCache = new Map();

class FlowEngine {
  /**
   * Engine Configuration
   * @type {{ storage: 'none' | 'session' | 'local', prefix: string }}
   */
  static config = {
    storage: 'none', // 'none' | 'session' | 'local'
    prefix: 'flow_cache:'
  };

  /**
   * Helper to resolve configured Web Storage interface
   * @returns {Storage | null}
   */
  static getStorage() {
    if (this.config.storage === 'session') return window.sessionStorage;
    if (this.config.storage === 'local') return window.localStorage;
    return null;
  }

  /**
   * Retrieve cached layout object from Memory or Web Storage
   * @param {string} expr 
   * @returns {Object | null}
   */
  static getCached(expr) {
    // 1. Check in-memory map first
    if (memoryCache.has(expr)) {
      return memoryCache.get(expr);
    }

    // 2. Check persistent storage fallback if configured
    const store = this.getStorage();
    if (store) {
      const item = store.getItem(this.config.prefix + expr);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          memoryCache.set(expr, parsed); // Hydrate memory cache
          return parsed;
        } catch (e) {
          // Fallback on JSON parse error
        }
      }
    }

    return null;
  }

  /**
   * Save resolved layout object to Memory and Web Storage
   * @param {string} expr 
   * @param {Object} resultObj 
   */
  static setCached(expr, resultObj) {
    memoryCache.set(expr, resultObj);

    const store = this.getStorage();
    if (store) {
      try {
        store.setItem(this.config.prefix + expr, JSON.stringify(resultObj));
      } catch (e) {
        // Handle storage quota limits gracefully
      }
    }
  }

  /**
   * Clear all cached expressions from Memory and Storage
   */
  static clearCache() {
    memoryCache.clear();
    const store = this.getStorage();
    if (store) {
      Object.keys(store)
        .filter((k) => k.startsWith(this.config.prefix))
        .forEach((k) => store.removeItem(k));
    }
  }

  /**
   * Pure parser function with multi-tier caching
   * @param {HTMLElement} el 
   */
  static parse(el) {
    const expr = el.getAttribute('data-flow');
    if (!expr) return;

    const trimmedExpr = expr.trim();

    // --- CACHE HIT ---
    let layoutProps = this.getCached(trimmedExpr);

    // --- CACHE MISS: Execute Full Token Parsing ---
    if (!layoutProps) {
      const tokens = trimmedExpr.split(/\s+/);

      // Layout State Defaults
      let display = 'grid';
      let cols = 'unset';
      let rows = 'unset';
      let auto = 'row';
      let dir = 'row';
      let wrap = 'nowrap';
      let justify = 'normal';
      let align = 'normal';
      let gap = '1rem';
      let ratio = 'unset';

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // 1. Display Switches & Native Masonry
        if (token === 'masonry') {
          display = 'grid';
          rows = 'masonry';
          if (cols === 'unset') {
            cols = 'repeat(auto-fill, minmax(200px, 1fr))';
          }
        } else if (token === 'flex') {
          display = 'flex';
        } else if (token === 'inline-flex') {
          display = 'inline-flex';
        } else if (token === 'grid') {
          display = 'grid';
        }

        // 2. Dynamic NxM & Column Patterns
        else if (/^\d+x\d+$/i.test(token)) {
          display = 'grid';
          const [r, c] = token.toLowerCase().split('x');
          rows = `repeat(${r}, 1fr)`;
          cols = `repeat(${c}, 1fr)`;
        } else if (/^\d+$/.test(token)) {
          display = 'grid';
          cols = `repeat(${token}, 1fr)`;
        } else if ((token === 'auto-fit' || token === 'auto-fill') && tokens[i + 1]) {
          display = 'grid';
          const minSize = tokens[i + 1];
          cols = `repeat(${token}, minmax(${minSize}, 1fr))`;
          i++;
        }

        // 3. Dynamic Gap (gap-1rem and functional gap(1rem 2rem))
        else if (/^gap\(([^)]+)\)$/i.test(token)) {
          const match = token.match(/^gap\(([^)]+)\)$/i);
          gap = match[1].replace(/,/g, ' ').trim();
        } else if (token.startsWith('gap-')) {
          gap = token.replace('gap-', '');
        }

        // 4. Aspect Ratio
        else if (/^(?:ratio|aspect)\(([^)]+)\)$/i.test(token)) {
          const match = token.match(/^(?:ratio|aspect)\(([^)]+)\)$/i);
          ratio = match[1].replace(':', ' / ');
        } else if (/^\d+[:/]\d+$/.test(token)) {
          ratio = token.replace(':', ' / ');
        } else if (token === 'square') {
          ratio = '1 / 1';
        } else if (token === 'landscape') {
          ratio = '16 / 9';
        } else if (token === 'portrait') {
          ratio = '9 / 16';
        }

        // 5. Flex Direction & Alignment
        else if (token === 'row' || token === 'row-reverse') {
          dir = token;
          auto = token;
        } else if (token === 'col' || token === 'column') {
          dir = 'column';
          auto = 'column';
        } else if (token === 'wrap' || token === 'nowrap') {
          display = 'flex';
          wrap = token;
        } else if (token === 'center') {
          justify = 'center';
          align = 'center';
        } else if (token === 'between') {
          justify = 'space-between';
        } else if (token === 'dense') {
          auto += ' dense';
        }
      }

      layoutProps = {
        display,
        cols,
        rows,
        auto,
        dir,
        wrap,
        justify,
        align,
        gap,
        ratio
      };

      // Write parsed layout object to cache
      this.setCached(trimmedExpr, layoutProps);
    }

    // Apply tokens via curried setter directly to inline CSS variables
    const tkn = setToken(el);
    entries(layoutProps).forEach(([k, v]) => tkn(k, v));
  }
}
