// @aufbau/webcomponents/toc.js
// <aufbau-toc>

class AufbauToc extends HTMLElement {
  static get observedAttributes() {
    return ['target', 'selector'];
  }

  connectedCallback() {
    this.initToc();
  }

  attributeChangedCallback() {
    this.initToc();
  }

  initToc() {
    const targetQuery = this.getAttribute('target');
    const selector = this.getAttribute('selector') || 'h1, h2, h3, h4, h5, h6';

    const targetEl = targetQuery ? document.querySelector(targetQuery) : null;
    if (!targetEl) return;

    const headings = targetEl.querySelectorAll(selector);
    const items = [];

    headings.forEach((el, index) => {
      const text = el.textContent?.trim() || '';
      
      let level = 1;
      const match = el.tagName.match(/^H([1-6])$/i);
      if (match) {
        level = parseInt(match[1], 10);
      } else if (el.dataset.level) {
        level = parseInt(el.dataset.level, 10);
      }

      // Inject ID into target element if missing
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

// Register Web Component
if (typeof window !== 'undefined' && !customElements.get('aufbau-toc')) {
  customElements.define('aufbau-toc', AufbauToc);
}
