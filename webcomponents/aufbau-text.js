import { AufbauElement } from './AufbauElement.js';
import aufbau from '@aufbau/kit';

export class AufbauText extends AufbauElement {
  static get observedAttributes() {
    return ['src', 'raw'];
  }

  onMount() {
    // Preserve initial light DOM HTML if neither src nor raw attribute is set
    if (!this.hasAttribute('src') && !this.hasAttribute('raw') && !this._originalContent) {
      this._originalContent = this.innerHTML.trim();
    }
  }

  async update() {
    const src = this.getAttribute('src');
    const raw = this.getAttribute('raw') || this._originalContent;

    let htmlContent = '';

    if (src) {
      try {
        // @aufbau/import handles .md natively and returns rendered HTML string
        htmlContent = await aufbau.import(src);
      } catch (err) {
        console.warn(`[aufbau-text] Error loading markdown file from "${src}":`, err);
        htmlContent = `<p class="aufbau-text-error">Failed to load content.</p>`;
      }
    } else if (raw) {
      try {
        // Parse inline raw Markdown dynamically
        const { marked } = await import('https://esm.sh/marked@11.1.1');
        htmlContent      = await marked.parse(raw);
      } catch (err) {
        htmlContent = raw; // Fallback to raw text if parser fails
      }
    }

    this.innerHTML = `
      <article class="aufbau-text-content markdown-body">
        ${htmlContent}
      </article>
    `;

    this.emit('aufbau-text-rendered', { src, raw });
  }
}

customElements.define('aufbau-text', AufbauText);
