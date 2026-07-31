import { AufbauElement } from './AufbauElement.js';

// Lazy loader singleton for highlight.js
let hljsPromise = null;
function getHljs() {
  if (!hljsPromise) {
    hljsPromise = import('https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm').then(m => m.default);
  }
  return hljsPromise;
}

export class AufbauCode extends AufbauElement {
  static get observedAttributes() {
    return ['lang', 'language', 'code', 'no-copy'];
  }

  onMount() {
    // Save original inner text content if code attribute is not set
    if (!this.hasAttribute('code') && !this._originalCode) {
      this._originalCode = this.textContent.trim();
    }
  }

  async update() {
    const lang     = this.getAttribute('lang') || this.getAttribute('language') || 'plaintext';
    const rawCode  = this.getAttribute('code') || this._originalCode || '';
    const showCopy = !this.hasAttribute('no-copy');

    // 1. Initial UI shell render
    this.innerHTML = `
      <div class="aufbau-code-wrapper">
        <div class="code-header">
          <span class="code-lang">${lang}</span>
          ${showCopy ? `
            <button type="button" class="copy-btn" title="Copy code">
              <aufbau-icon icon="lucide:copy"></aufbau-icon>
            </button>
          ` : ''}
        </div>
        <pre><code class="language-${lang}">${this.escapeHtml(rawCode)}</code></pre>
      </div>
    `;

    // 2. Attach copy button event handler
    if (showCopy) {
      const copyBtn = this.querySelector('.copy-btn');
      copyBtn?.addEventListener('click', () => this.copyToClipboard(rawCode, copyBtn));
    }

    // 3. Lazy load highlight.js and apply syntax highlighting
    try {
      const hljs   = await getHljs();
      const codeEl = this.querySelector('code');
      if (codeEl) {
        hljs.highlightElement(codeEl);
      }
    } catch (err) {
      console.warn('[aufbau-code] Failed to lazy load highlight.js:', err);
    }
  }

  async copyToClipboard(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      
      const icon = btn.querySelector('aufbau-icon');
      if (icon) icon.setAttribute('icon', 'lucide:check');
      
      this.emit('aufbau-code-copy', { code: text });

      // Reset copy icon after 2 seconds
      setTimeout(() => {
        if (icon) icon.setAttribute('icon', 'lucide:copy');
      }, 2000);
    } catch (err) {
      console.error('[aufbau-code] Clipboard copy failed:', err);
    }
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

customElements.define('aufbau-code', AufbauCode);
