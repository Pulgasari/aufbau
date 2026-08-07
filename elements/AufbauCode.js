// <aufbau-code>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

const HLJS_VERSION = '11.9.0';
const HLJS_MODULE  = `https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/+esm`;
const HLJS_STYLES  = `https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/styles/`;
const HLJS_INDEX   = `https://data.jsdelivr.com/v1/packages/npm/highlight.js@${HLJS_VERSION}?structure=flat`;

// separate from [data-theme], which belongs to @aufbau/css themes
const THEME_ATTR = 'data-hljs-theme';

let hljsPromise   = null;
let themesPromise = null;

const getHljs = () => (hljsPromise ??= import(HLJS_MODULE).then(m => m.default));

// used when the jsdelivr file index is unreachable
const FALLBACK_THEMES = [
  'a11y-dark', 'a11y-light', 'agate', 'an-old-hope', 'androidstudio', 'arduino-light', 'arta', 'ascetic',
  'atom-one-dark', 'atom-one-dark-reasonable', 'atom-one-light', 'brown-paper', 'codepen-embed', 'color-brewer',
  'dark', 'default', 'devibeans', 'docco', 'far', 'felipec', 'foundation', 'github', 'github-dark',
  'github-dark-dimmed', 'gml', 'googlecode', 'gradient-dark', 'gradient-light', 'grayscale', 'hybrid', 'idea',
  'intellij-light', 'ir-black', 'isbl-editor-dark', 'isbl-editor-light', 'kimbie-dark', 'kimbie-light',
  'lightfair', 'lioshi', 'magula', 'mono-blue', 'monokai', 'monokai-sublime', 'night-owl', 'nnfx-dark',
  'nnfx-light', 'nord', 'obsidian', 'panda-syntax-dark', 'panda-syntax-light', 'paraiso-dark', 'paraiso-light',
  'pojoaque', 'purebasic', 'qtcreator-dark', 'qtcreator-light', 'rainbow', 'routeros', 'school-book',
  'shades-of-purple', 'srcery', 'stackoverflow-dark', 'stackoverflow-light', 'sunburst', 'tokyo-night-dark',
  'tokyo-night-light', 'tomorrow-night-blue', 'tomorrow-night-bright', 'vs', 'vs2015', 'xcode', 'xt256'
];

/**
 * loads and scopes a theme sheet. domina handles fetch, scoping, dedup and
 * adoption; adopted sheets cascade after author styles, so a page level hljs
 * <link> is overridden without !important.
 */
const loadTheme = (theme) => dom.adoptStylesheet(`${HLJS_STYLES}${theme}.min.css`, {
  scope : `aufbau-code[${THEME_ATTR}="${theme}"]`,
  key   : `hljs:${theme}`,
});

// handles both flat and nested jsdelivr index shapes
function collectThemes (data) {
  const found = [];
  const walk  = (files, prefix = '') => {
    for (const file of files ?? []) {
      const path = file.name.startsWith('/') ? file.name : `${prefix}/${file.name}`;
      if (file.files) { walk(file.files, path); continue; }
      if (path.startsWith('/styles/') && path.endsWith('.css') && !path.endsWith('.min.css')) {
        found.push(path.slice('/styles/'.length, -'.css'.length));
      }
    }
  };

  walk(data?.files);
  return found.sort();
}

export default class AufbauCode extends AufbauElement {
  static attr = {
    lang     : String,
    language : String,
    code     : String,
    noCopy   : Boolean,
    // falls back to <aufbau-config code-theme="..."> when the attribute is absent
    theme    : { type: String, config: true }
  };

  /**
   * every highlight.js theme of the pinned version, cached for the session.
   * @returns {Promise<string[]>}
   */
  static themes () {
    return (themesPromise ??= fetch(HLJS_INDEX)
      .then(response => response.json())
      .then(data => {
        const found = collectThemes(data);
        if (!found.length) throw new Error('empty theme index');
        return found;
      })
      .catch(error => {
        console.warn('[aufbau-code] theme index unreachable, using fallback list:', error);
        return [...FALLBACK_THEMES];
      }));
  }

  /** preloads a theme stylesheet without rendering anything */
  static preloadTheme (theme) { return loadTheme(theme); }

  onMount () {
    // keep the original inner text as source if no code attribute is set
    if (!this.hasAttribute('code') && this._originalCode === undefined) {
      this._originalCode = this.textContent.trim();
    }

    this.on('click', '.copy-btn', (e, btn) => this.copyToClipboard(this.source, btn));
  }

  onUnmount () { clearTimeout(this._copyTimer); }

  get source () { return this.getAttr('code') || this._originalCode || ''; }

  get lang () {
    const { lang, language } = this.getAttr();
    return lang || language || 'plaintext';
  }

  render () {
    const { noCopy } = this.getAttr();

    return html`
      <div class="aufbau-code-wrapper">
        <div class="code-header">
          <span class="code-lang">${this.lang}</span>
          ${!noCopy && html`
            <button type="button" class="copy-btn" title="Copy code">
              <aufbau-icon icon="lucide:copy"></aufbau-icon>
            </button>
          `}
        </div>
        <pre><code class="language-${this.lang}">${this.source}</code></pre>
      </div>
    `;
  }

  /** highlighting rewrites the code node, so it only runs on a real rebuild */
  async onRender () {
    try {
      const hljs   = await getHljs();
      const codeEl = this.$('code');
      if (codeEl && this.isConnected) hljs.highlightElement(codeEl);
    } catch (error) {
      console.warn('[aufbau-code] failed to lazy load highlight.js:', error);
    }
  }

  sync () {
    const { theme } = this.getAttr();

    // data-hljs-theme is not observed, so this cannot loop back into update()
    if (theme) {
      this.setAttribute(THEME_ATTR, theme);
      loadTheme(theme);
    } else {
      this.removeAttribute(THEME_ATTR);
    }
  }

  async copyToClipboard (text, btn) {
    try {
      await navigator.clipboard.writeText(text);

      const icon = btn.querySelector('aufbau-icon');
      icon?.setAttribute('icon', 'lucide:check');

      this.emit('aufbau-code-copy', { code: text });

      clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => icon?.setAttribute('icon', 'lucide:copy'), 2000);
    } catch (error) {
      console.error('[aufbau-code] clipboard copy failed:', error);
    }
  }
}

AufbauCode.init();
