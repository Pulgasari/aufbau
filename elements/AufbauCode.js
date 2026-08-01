// <aufbau-code>

import AufbauElement from './AufbauElement.js';

// lazy loader singleton for highlight.js
let hljsPromise = null;
const getHljs = () => (hljsPromise ??= import('https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm').then(m => m.default));

const escapeHtml = (str) => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export default class AufbauCode extends AufbauElement {
  static attr = ['lang', 'language', 'code', 'no-copy'];

  onMount () {
    // save original inner text if no code attribute is set
    if (!this.hasAttribute('code') && !this._originalCode) {
      this._originalCode = this.textContent.trim();
    }
  }

  async update () {
    const { lang, language, code } = this.getAttr();
    const { noCopy } = this.getAttr(Boolean);

    const usedLang = lang || language || 'plaintext';
    const rawCode  = code || this._originalCode || '';
    const showCopy = !noCopy;

    // 1. render shell
    this.innerHTML = `
      <div class="aufbau-code-wrapper">
        <div class="code-header">
          <span class="code-lang">${usedLang}</span>
          ${showCopy ? `
            <button type="button" class="copy-btn" title="Copy code">
              <aufbau-icon icon="lucide:copy"></aufbau-icon>
            </button>
          ` : ''}
        </div>
        <pre><code class="language-${usedLang}">${escapeHtml(rawCode)}</code></pre>
      </div>
    `;

    // 2. wire up copy button
    if (showCopy) {
      const copyBtn = this.$('.copy-btn');
      copyBtn?.on('click', () => this.copyToClipboard(rawCode, copyBtn));
    }

    // 3. lazy load highlight.js
    try {
      const hljs   = await getHljs();
      const codeEl = this.$('code');
      if (codeEl) hljs.highlightElement(codeEl);
    } catch (e) {
      console.warn('[aufbau-code] Failed to lazy load highlight.js:', e);
    }
  }

  async copyToClipboard (text, btn) {
    try {
      await navigator.clipboard.writeText(text);

      const icon = btn.querySelector('aufbau-icon');
      icon?.setAttribute('icon', 'lucide:check');

      this.emit('aufbau-code-copy', { code: text });

      setTimeout(() => icon?.setAttr('icon', 'lucide:copy'), 2000);
    } catch (e) {
      console.error('[aufbau-code] Clipboard copy failed:', e);
    }
  }
}

AufbauCode.init();
