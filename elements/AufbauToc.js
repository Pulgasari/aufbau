// <aufbau-toc>

import AufbauElement from './AufbauElement.js';

export default class AufbauToc extends AufbauElement {
  static attr = {
    target   : String,
    selector : 'h1, h2, h3, h4, h5, h6'
  };

  constructor () {
    super();
    this._observer = null;
  }

  onMount () {
    this.initToc();
    this.setupObserver();
  }

  onUnmount () {
    this.cleanupObserver();
  }

  onAttributeChange () {
    this.initToc();
    this.setupObserver();
  }

  cleanupObserver () {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  setupObserver () {
    this.cleanupObserver();

    const { target: targetQuery } = this.getAttr();
    const targetEl = targetQuery ? document.querySelector(targetQuery) : null;
    if (!targetEl) return;

    this._observer = new MutationObserver(() => {
      this._observer.disconnect();
      this.initToc();

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

  initToc () {
    const { target: targetQuery, selector } = this.getAttr();

    const targetEl = targetQuery ? document.querySelector(targetQuery) : null;
    if (!targetEl) {
      this.innerHTML = '';
      return;
    }

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

  render (items) {
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

AufbauToc.init();
