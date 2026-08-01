// <aufbau-text>

import AufbauElement from './AufbauElement.js';
import importFile    from '@aufbau/import';

export class AufbauText extends AufbauElement {
  static get observedAttributes () {
    return ['src', 'raw'];
  }

  onMount () {
    // preserve initial light-DOM HTML if neither src nor raw is set
    if (!this.hasAttribute('src') && !this.hasAttribute('raw') && !this._originalContent) {
      this._originalContent = this.innerHTML.trim();
    }
  }

  async update () {
    const src = this.attr('src');
    const raw = this.attr('raw') || this._originalContent;

    let html = '';

    if (src) {
      try {
        // @aufbau/import handles .md natively and returns rendered HTML
        html = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-text] Error loading markdown file from "${src}":`, err);
        html = `<p class="aufbau-text-error">Failed to load content.</p>`;
      }
    } else if (raw) {
      try {
        const { marked } = await import('https://esm.sh/marked@11.1.1');
        html = await marked.parse(raw);
      } catch {
        html = raw; // fallback to raw text if parser fails
      }
    }

    this.innerHTML = `<article class="aufbau-text-content markdown-body">${html}</article>`;
    this.emit('aufbau-text-rendered', { src, raw });
  }
}

if (!customElements.get('aufbau-text')) customElements.define('aufbau-text', AufbauText);
export default AufbauText;
