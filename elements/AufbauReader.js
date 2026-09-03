// <aufbau-reader>
// renders prose. was <aufbau-text>.
//
// markdown handling goes through @aufbau/import for both `src` and `raw`,
// the element no longer reaches out to a cdn on its own.

import { AufbauElement } from './core/index.js';
import { importFile, renderMD } from '@aufbau/import';
import { html, raw as rawHtml } from './core/html.js';

export default class AufbauReader extends AufbauElement {
  static attr = {
    format : { type: String, default: 'markdown', values: ['html', 'markdown'] },
    raw    : String,
    src    : String,
  };

  // optional consumer hook: (root, ctx) => void | Promise, run over the parsed
  // markup before it is committed. declared as a field so it exists on the element
  // instance — a framework (e.g. preact) only forwards a function-valued prop when
  // the property is already present, otherwise it would drop it silently.
  transform = null;

  // authored inline content stays in the light dom and serves as the fallback source
  get renderTarget () { return this.shell('aufbau-reader-ui'); }

  get state () { return this.getAttribute('data-state') ?? 'idle'; }

  onMount () {
    // read before the shell is appended, otherwise it would count as content
    const { raw, src } = this.getAttr();
    if (!src && !raw) this._inline ??= this.innerHTML.trim();
  }

  async update () {
    const { format, raw, src } = this.getAttr();
    const source = src || raw || this._inline || '';

    if (source === this._source && this.state !== 'idle') return super.update();
    this._source = source;

    if (!source) { this._html = ''; return this.finish('idle'); }

    this.setAttribute('data-state', 'loading');

    try {
      // one pipeline for both paths: importFile dispatches on the extension,
      // renderMD reuses the very same configured markdown compiler
      const markup = src            ? await importFile(src)
                   : format === 'html' ? source
                   :                     await renderMD(source);

      // optional consumer hook — rewrite the parsed markup before it is committed
      // (resolve folder-relative assets, tag links). kept generic so an app reading
      // local files injects its own resolution without re-implementing rendering.
      this._html = await this.applyTransform(markup);
      this.finish('ready');
    } catch (error) {
      console.warn(`[aufbau-reader] could not render ${src ? `"${src}"` : 'inline content'}:`, error);
      this._html = null;
      this.finish('error');
    }

    return this;
  }

  // runs a consumer-set `transform(root, ctx)` over a detached copy of the parsed
  // markup and returns the (possibly rewritten) html string. no transform -> the
  // markup passes through untouched, so existing usage is unaffected. the update()
  // above awaits renderMD first, so the property is set by the time this runs even
  // when the framework assigns `transform` and `raw` in the same commit.
  async applyTransform (markup) {
    if (typeof this.transform !== 'function' || typeof document === 'undefined') return markup;
    const root = document.createElement('div');
    root.innerHTML = markup;
    await this.transform(root, { src: this.getAttr('src'), format: this.getAttr('format') });
    return root.innerHTML;
  }

  finish (state) {
    this.setAttribute('data-state', state);
    super.update();
    if (state !== 'loading') this.emit('aufbau-reader-rendered', { state, src: this.getAttr('src') });
    return this;
  }

  render () {
    if (this.state === 'loading') return html`<div class="reader-status is-loading" role="status">loading…</div>`;
    if (this.state === 'error')   return html`<div class="reader-status is-error" role="alert">could not load content.</div>`;

    // importFile/importString return trusted, already parsed markup
    return html`<article class="reader-content markdown-body">${rawHtml(this._html ?? '')}</article>`;
  }
}

AufbauReader.init();
