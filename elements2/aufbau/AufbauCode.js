// <aufbau-code>

import { actionButtons, bindActions, parseActions } from '../lib/actions.js';
import { attrs, html }          from '../lib/html.js';
import { AufbauElement }        from '../base/AufbauElement.js';
import { dedent }               from '../lib/utils.js';
import { getConfig, setConfig } from '../lib/config.js';

import { adoptStylesheet } from '@domina/methods/adoptStylesheet.js';
import { isFn }            from '@pulgasari/is';

const HLJS_VERSION = '11.9.0';
const HLJS_MODULE  = `https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/+esm`;
const HLJS_STYLES  = `https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}/styles/`;
const HLJS_INDEX   = `https://data.jsdelivr.com/v1/packages/npm/highlight.js@${HLJS_VERSION}?structure=flat`;      
const THEME_ATTR   = 'data-hljs-theme'; // separate from [data-theme], which belongs to @aufbau/css themes

let hljsPromise   = null;
let themesPromise = null;

const getHljs = () => (
  hljsPromise ??= import('hljs')
  .catch(() => import(HLJS_MODULE))
  .then(m => m.default)
);

// ::: languages

const languages = new Map;

setConfig({ 'code-languages-poo': '@poo/hljs' }, { layer: 'defaults' });

const languageSource = (name) => languages.get(name) ?? getConfig(`code-languages-${name}`);

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

const FALLBACK_THEMES = ['dracula', 'github', 'github-dark'];

const THEME_PATHS = { dracula: 'base16/dracula' };

setConfig({ 'code-theme': 'github-dark' }, { layer: 'defaults' });

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

// ::: editing

const HIGHLIGHT_DELAY = 150;

function caretOffset (root) {
  const selection = root.ownerDocument.getSelection();
  if (!selection?.rangeCount || !root.contains(selection.focusNode)) return null;
  const range = root.ownerDocument.createRange();
  range.selectNodeContents(root);
  range.setEnd(selection.focusNode, selection.focusOffset);
  return range.toString().length;
}

function setCaret (root, offset) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node, rest = offset;
  while ((node = walker.nextNode())) {
    if (rest <= node.length) break;
    rest -= node.length;
  }
  const range = root.ownerDocument.createRange();
  if (node) range.setStart(node, rest);
  else      range.selectNodeContents(root), range.collapse(false);
  range.collapse(true);
  const selection = root.ownerDocument.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

export default class AufbauCode extends AufbauElement {
  static attr = {
    actions  : { type: String, default: 'copy paste clear' },
    code     : String,
    editable : Boolean,
    lang     : String,
    language : String,
    noCopy   : Boolean,
    theme    : { type: String, config: true }
  };

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
      --gap: small; /* gap: var(--aufbau-control-gap, 0.5em); */
      
      align-items : center;
      display     : flex;
      flex        : none;
      justify-content : space-between;

      > span {
        font-family : var(--font-family-mono, ui-monospace, monospace);
        font-size   : 0.8em;
        line-height : 1;
        margin-inline-end : auto;
      }
      > div {
        display : inline-flex;
        gap     : small;
      }
      button {
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
j
  static registerLanguage (name, source) {
    languages.set(name, source);
    resolved.delete(name);
    return this;
  }
  
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

  static preloadTheme (theme) { return loadTheme (theme); }

  onMount () {
    bindActions(this);

    this.on('focusin', 'code[contenteditable]', () => { this._focusedCode = this.source; });

    this.on('input', 'code[contenteditable]', (event, node) => {
      this._editedCode = node.textContent;
      this.emit('input', { code: this._editedCode });
      clearTimeout(this._highlightTimer);
      this._highlightTimer = setTimeout(() => this.highlightInPlace(node), HIGHLIGHT_DELAY);
    });

    this.on('focusout', 'code[contenteditable]', () => {
      if (this._editedCode === undefined || this._editedCode === this._focusedCode) return;
      this._focusedCode = this._editedCode;
      this.emit('change', { code: this._editedCode });
    });
  }

  onUnmount () { clearTimeout(this._highlightTimer); }

  async highlightInPlace (node) {
    const source = node.textContent;
    if (source === this._highlighted) return;

    try {
      const hljs = await getHljs();
      await useLanguage(hljs, this.lang);
      // typed on meanwhile, the next timer takes it
      if (!node.isConnected || node.textContent !== source) return;

      const language = hljs.getLanguage(this.lang) ? this.lang : 'plaintext';
      const caret    = caretOffset(node);
      node.innerHTML = hljs.highlight(source, { ignoreIllegals: true, language }).value;
      if (caret !== null) setCaret(node, caret);
      this._highlighted = source;
    } catch (error) {
      console.warn('[aufbau-code] could not highlight the edit:', error);
    }
  }

  onAttributeChange (name) { if (name === 'code') this._editedCode = undefined; }
  onSourceChange    ()     { this._editedCode = undefined; this.invalidate().update(); }

  get source () {
    if (this._editedCode !== undefined)
    return this._editedCode;
    return this.getAttr('code') || dedent(this.sourceText);
  }

  // the current text, including edits made through `editable`
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

  // the contract with lib/actions.js
  actionText   () { return this.source; }
  actionTarget () { return this.getAttr('editable') ? this.$('figure > pre > code') : null; }

  render () {
    const { editable } = this.getAttr();

    return html`
      <header>
        <span>${this.lang}</span>
        <div>${actionButtons(this.actions)}</div>
      </header>
      <pre><code class="language-${this.lang}" ${attrs({
        contenteditable : editable && 'plaintext-only',
        spellcheck      : editable && 'false'
      })}>${this.source}</code></pre>
    `;
  }

  async onRender () {
    const source = this.source;

    try {
      const hljs = await getHljs();
      await useLanguage(hljs, this.lang);

      const $code = this.output?.querySelector('pre > code');
      if (!$code || !this.isConnected || this.source !== source) return;

      hljs.highlightElement($code);
      this._highlighted = source;
    } catch (error) {
      console.warn('[aufbau-code] failed to lazy load highlight.js:', error);
    }
  }

  sync () {
    const { theme } = this.getAttr();

    if (theme) {
      this.setAttribute(THEME_ATTR, theme);
      loadTheme(theme);
    } else {
      this.removeAttribute(THEME_ATTR);
    }
  }
}

AufbauCode.init();
