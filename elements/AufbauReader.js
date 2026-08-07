// <aufbau-reader>
// renders prose. was <aufbau-text>.
//
// markdown handling goes through @aufbau/import for both `src` and `raw`,
// the element no longer reaches out to a cdn on its own.

import { AufbauElement } from './core/index.js';
import { importFile, renderMD } from '@aufbau/import';
import { html, raw as rawHtml } from '@aufbau/js';

export default class AufbauReader extends AufbauElement {
  static attr = {
    format : { type: String, default: 'markdown', values: ['html', 'markdown'] },
    raw    : String,
    src    : String,
  };

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
      this._html = src            ? await importFile(src)
                 : format === 'html' ? source
                 :                     await renderMD(source);
      this.finish('ready');
    } catch (error) {
      console.warn(`[aufbau-reader] could not render ${src ? `"${src}"` : 'inline content'}:`, error);
      this._html = null;
      this.finish('error');
    }

    return this;
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
