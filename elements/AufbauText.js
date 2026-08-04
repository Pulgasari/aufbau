// <aufbau-text>

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';

export default class AufbauText extends AufbauElement {
  static attr = {
    src : String,
    raw : String
  };

  onMount () {
    const { src, raw } = this.getAttr();
    if (!src && !raw && !this._originalContent) {
      this._originalContent = this.innerHTML.trim();
    }
  }

  async update () {
    const { src } = this.getAttr();
    const raw = this.getAttr('raw') || this._originalContent;

    let html = '';

    if (src) {
      try {
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
        html = raw;
      }
    }

    this.innerHTML = `<article class="aufbau-text-content markdown-body">${html}</article>`;
    this.emit('aufbau-text-rendered', { src, raw });
  }
}

AufbauText.init();
