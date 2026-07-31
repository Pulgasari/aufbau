// docs/components/AufbauToc.js

class AufbauToc extends HTMLElement {
  static get observedAttributes() {
    return ['target', 'selector'];
  }

  constructor() {
    super();
    // Storage for active MutationObserver instance
    this._observer = null;
  }

  connectedCallback() {
    this.initToc();
    this.setupObserver();
  }

  disconnectedCallback() {
    // Clean up memory leaks when component is unmounted
    this.cleanupObserver();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.initToc();
      this.setupObserver();
    }
  }

  cleanupObserver() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  setupObserver() {
    this.cleanupObserver();

    const targetQuery = this.getAttribute('target');
    const targetEl = targetQuery ? document.querySelector(targetQuery) : null;
    if (!targetEl) return;

    // Observe changes inside target element (e.g., when @aufbau/import swaps content)
    this._observer = new MutationObserver(() => {
      // Pause observer briefly to avoid infinite loops if TOC modifies target DOM
      this._observer.disconnect();
      this.initToc();
      
      // Re-attach observer
      this._observer.observe(targetEl, {
        childList: true,
        subtree: true
      });
    });

    this._observer.observe(targetEl, {
      childList: true,
      subtree: true
    });
  }

  initToc() {
    const targetQuery = this.getAttribute('target');
    const selector = this.getAttribute('selector') || 'h1, h2, h3, h4, h5, h6';

    const targetEl = targetQuery ? document.querySelector(targetQuery) : null;
    if (!targetEl) {
      this.innerHTML = '';
      return;
    }

    const headings = targetEl.querySelectorAll(selector);
    const items = [];

    headings.forEach((el, index) => {
      const text = el.textContent?.trim() || '';
      
      // Calculate level from tag name or dataset
      let level = 1;
      const match = el.tagName.match(/^H([1-6])$/i);
      if (match) {
        level = parseInt(match[1], 10);
      } else if (el.dataset.level) {
        level = parseInt(el.dataset.level, 10);
      }

      // Ensure target element has a unique anchor ID
      if (!el.id) {
        el.id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-') || `heading-${index}`;
      }

      items.push({ id: el.id, text, level });
    });

    this.render(items);
  }

  render(items) {
    if (!items.length) {
      this.innerHTML = '';
      return;
    }

    this.innerHTML = `
      <nav class="docs-toc-nav">
        <h4>On This Page</h4>
        <ul>
          ${items.map(item => `
            <li class="toc-level-${item.level}">
              <a href="#${item.id}">${item.text}</a>
            </li>
          `).join('')}
        </ul>
      </nav>
    `;
  }
}

// Register custom element
if (typeof window !== 'undefined' && !customElements.get('aufbau-toc')) {
  customElements.define('aufbau-toc', AufbauToc);
}
