// <aufbau-code>

import { actionButtons, bindActions, parseActions } from './core/actions.js';
import { attrs, html }          from './core/html.js';
import { AufbauElement }        from './core/index.js';
import { dedent }               from './core/utils.js';
import { getConfig, setConfig } from './core/AufbauConfig.js';

import { adoptStylesheet } from '@domina/methods/adoptStylesheet.js';
import { isFn }            from '@pulgasari/is';

const HLJS_VERSION = '11.9.0';
const HLJS_MODULE  = `https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/+esm`;
const HLJS_STYLES  = `https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/styles/`;
const HLJS_INDEX   = `https://data.jsdelivr.com/v1/packages/npm/highlight.js@${HLJS_VERSION}?structure=flat`;      
const THEME_ATTR   = 'data-hljs-theme'; // separate from [data-theme], which belongs to @aufbau/css themes

let hljsPromise   = null;
let themesPromise = null;

/**
 * the bare specifier first, so a page that remaps `hljs` in its import map to a
 * self hosted build gets that one instance everywhere. the pinned cdn url is
 * only the fallback for pages without the aufbau import map.
 */
const getHljs = () => (
  hljsPromise ??= import('hljs')
  .catch(() => import(HLJS_MODULE))
  .then(m => m.default)
);

// ::: languages

// name -> hljs language definition, or a module specifier resolving to one.
// module specifiers can also come from <aufbau-config code-languages-<name>="…">
const languages = new Map;

// poo ships with the element. the defaults layer is the lowest config layer, so
// a page can point the specifier somewhere else without any api call
setConfig({ 'code-languages-poo': '@poo/hljs' }, { layer: 'defaults' });

const languageSource = (name) => languages.get(name) ?? getConfig(`code-languages-${name}`);

// resolved once per name, whether it worked or not. a missing grammar is not
// fatal, hljs just falls back to auto detection
const resolved = new Map;

function useLanguage (hljs, name) {
  if (!name || hljs.getLanguage(name)) return Promise.resolve();
  if (resolved.has(name))              return resolved.get(name);

  const source = languageSource(name);
  if (!source) return Promise.resolve();

  const pending = (async () => {
    const definition = isFn(source) ? source : (await import(source)).default;
    if (!isFn(definition)) throw new Error('module has no default export returning a language definition');
    hljs.registerLanguage(name, definition);
  })().catch(error => console.warn(`[aufbau-code] could not register language "${name}":`, error));

  resolved.set(name, pending);
  return pending;
}

// used ONLY when the jsdelivr file index is unreachable. the regular path stays
// fully dynamic and offers every theme of the pinned version, see themes()
const FALLBACK_THEMES = ['dracula', 'github', 'github-dark'];

// themes that do not sit directly in /styles. the index returns these with their
// folder already attached, the map only covers the short names used above
const THEME_PATHS = { dracula: 'base16/dracula' };

// a default theme ships with the element, so highlighting paints out of the box.
// without it sync() finds no theme, never adopts a token sheet, and hljs tokens
// stay uncolored. the defaults layer is the lowest config layer, so a page still
// overrides it with `theme="…"` or <aufbau-config code-theme="…"> without any api call
setConfig({ 'code-theme': 'github-dark' }, { layer: 'defaults' });

/**
 * loads and scopes a theme sheet. domina handles fetch, scoping, dedup and
 * adoption; adopted sheets cascade after author styles, so a page level hljs
 * <link> is overridden without !important.
 */
const loadTheme = (theme) => adoptStylesheet(`${HLJS_STYLES}${THEME_PATHS[theme] ?? theme}.min.css`, {
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
    // copy always, paste and clear only take effect with `editable`
    actions  : { type: String, default: 'copy paste clear' },
    code     : String,
    editable : Boolean,
    lang     : String,
    language : String,
    noCopy   : Boolean,
    // falls back to <aufbau-config code-theme="..."> when the attribute is absent
    theme    : { type: String, config: true }
  };

  // structure only, the hljs theme paints the tokens and the skin does the frame.
  // the host is the frame, header and pre are its only children
  // the children are the code (static source) and stay untouched, the output is
  // a <figure> in the light dom: header (language + actions) and pre > code
  static source = { tag: 'figure' };

  static styles = `aufbau-code {
    display  : block;
    font     : inherit;
    overflow : hidden;

    > figure {
      display        : flex;
      flex-direction : column;
      margin         : 0;
    }

    > figure > header {
      align-items     : center;
      display         : flex;
      flex            : none;
      gap             : var(--aufbau-control-gap, 0.5em);
      justify-content : space-between;

      > span {
        font-family : var(--font-family-mono, ui-monospace, monospace);
        font-size   : 0.8em;
        line-height : 1;
        margin-inline-end : auto;
      }

      > button {
        align-items : center;
        background  : none;
        border      : 0;
        color       : inherit;
        cursor      : pointer;
        display     : inline-flex;
        flex        : none;
        font        : inherit;
        margin      : 0;
      }
    }

    > figure > pre {
      margin     : 0;
      overflow-x : auto;
    }

    code {
      display     : block;
      font-family : var(--font-family-mono, ui-monospace, monospace);
      tab-size    : 2;
      white-space : pre;

      &[contenteditable] {
        caret-color : currentColor;
        outline     : none;
      }
    }
  }`;

  /**
   * teaches every <aufbau-code> a grammar highlight.js does not ship.
   * @param {string} name
   * @param {Function|string} source - a language definition or a module specifier
   */
  static registerLanguage (name, source) {
    languages.set(name, source);
    resolved.delete(name);
    return this;
  }

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
    bindActions(this);

    // typing must NOT write back into the code attribute:
    // it is observed, would trigger update(), rebuild the markup and drop the caret. 
    // the edit is held aside and only re-highlighted once the field is left. 
    // focusout instead of blur, blur does not bubble and could not be delegated
    this.on('input', 'code[contenteditable]', (event, node) => {
      this._editedCode = node.textContent;
      this.emit('input', { code: this._editedCode });
    });

    this.on('focusout', 'code[contenteditable]', () => {
      if (this._editedCode === undefined || this._editedCode === this._highlighted) return;
      this.emit('change', { code: this._editedCode });
      this.invalidate().update();
    });
  }

  // an external write to `code` or to the children wins over a pending edit
  onAttributeChange (name) { if (name === 'code') this._editedCode = undefined; }
  onSourceChange    ()     { this._editedCode = undefined; this.invalidate().update(); }

  get source () {
    if (this._editedCode !== undefined) return this._editedCode;
    return this.getAttr('code') || dedent(this.sourceText);
  }

  /** the current text, including edits made through `editable` */
  get code () { return this.source; }

  get lang () {
    const { lang, language } = this.getAttr();
    return lang || language || 'plaintext';
  }

  get actions () {
    const { editable, noCopy } = this.getAttr();
    return parseActions(this.getAttr('actions'))
      .filter(action => action === 'copy' ? !noCopy : editable);
  }

  // the contract with core/actions.js
  actionText   () { return this.source; }
  actionTarget () { return this.getAttr('editable') ? this.$('figure > pre > code') : null; }

  render () {
    const { editable } = this.getAttr();

    // language-* is the highlight.js contract, the one class that stays
    return html`
      <header>
        <span>${this.lang}</span>
        ${actionButtons(this.actions)}
      </header>
      <pre><code class="language-${this.lang}" ${attrs({ contenteditable: editable && 'plaintext-only', spellcheck: editable && 'false' })}>${this.source}</code></pre>
    `;
  }

  /** highlighting rewrites the code node, so it only runs on a real rebuild */
  async onRender () {
    const source = this.source;

    try {
      const hljs = await getHljs();
      await useLanguage(hljs, this.lang);

      const $code = this.$('code');
      // the node may already be gone or stale again after the await
      if (!$code || !this.isConnected || this.source !== source) return;

      hljs.highlightElement($code);
      this._highlighted = source;
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
}

AufbauCode.init();
