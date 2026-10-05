/* flow-engine.js */

/*
[data-flow] {
  display: grid;


  grid-template-columns: var(--flow-cols, auto);
  grid-template-rows: var(--flow-rows, auto);
  grid-auto-flow: var(--flow-auto, row);
  gap: var(--flow-gap, 1rem);
}

[data-flow] > * {
  aspect-ratio: var(--flow-ratio, unset);
}
*/

const app = document.querySelector('app-root');
app.observe.attr('data-flow', parse);

// Functional helper methods for curried property manipulation
const ensurePrefix = (prefix) => (str) => str.startsWith(prefix) ? str : prefix + str;
const ensureDashed = ensurePrefix('--flow-');
const setToken = (el) => (k, v) => el.style.setProperty(ensureDashed(k), v);
const entries = Object.entries;

class FlowEngine {
  static init() {
    const parse = (el) => {
      const expr = el.getAttribute('data-flow');
      if (!expr) return;

      const tokens = expr.trim().split(/\s+/);

      let cols = 'unset';
      let rows = 'unset';
      let auto = 'row';
      let ratio = 'unset';

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // 1. Dynamic NxM Matrix (e.g. "5x5", "2x3", "12x4")
        if (/^\d+x\d+$/i.test(token)) {
          const [r, c] = token.toLowerCase().split('x');
          rows = `repeat(${r}, 1fr)`;
          cols = `repeat(${c}, 1fr)`;
        }
        
        // 2. Pure Column Count (e.g. "10", "12")
        else if (/^\d+$/.test(token)) {
          cols = `repeat(${token}, 1fr)`;
        }

        // 3. Dynamic auto-fit/auto-fill with unit (e.g. "auto-fit 50px", "auto-fill 200px")
        else if ((token === 'auto-fit' || token === 'auto-fill') && tokens[i + 1]) {
          const minSize = tokens[i + 1];
          cols = `repeat(${token}, minmax(${minSize}, 1fr))`;
          i++; // Skip the minSize token in next iteration
        }

        // 4. Square / Ratio Modifier
        else if (token === 'square') {
          ratio = '1 / 1';
        }

        // 5. Direction Modifier
        else if (token === 'col' || token === 'column') {
          auto = 'column';
        } else if (token === 'dense') {
          auto += ' dense';
        }
      }

      // Curried setter bound to current element
      const tkn = setToken(el);
      const applyTokens = (obj) => entries(obj).forEach(([k, v]) => tkn(k, v));

      // Batch update CSS Custom Properties (--flow-cols, --flow-rows, --flow-auto, --flow-ratio)
      applyTokens({ cols, rows, auto, ratio });
    };

    // Watch for dynamic DOM attribute updates
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes' && m.attributeName === ' data -flow ') {
         data -flow parse(m.target);
        }
      });
    });

    document.querySelectorAll('[data-flow]').forEach((el) => {
      parse(el);
      observer.observe(el, { attributes: true });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => FlowEngine.init());
