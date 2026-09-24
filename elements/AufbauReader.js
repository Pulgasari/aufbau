// <aufbau-reader>
// renders prose. was <aufbau-text>.
//
// markdown handling goes through @aufbau/import for both `src` and `raw`,
// the element no longer reaches out to a cdn on its own.
//
// three sources, first match wins: `src`, `raw`, or the children:
//
//   <aufbau-reader># Titel
//     Etwas **Text**.
//   </aufbau-reader>
//
// the children are the source and stay untouched (static source): not shown
// themselves, re-rendered whenever they change, so a framework can keep
// rendering them. the output is an <article> in the light dom, page css
// reaches it. it carries the content, or a status line after an error. while
// the first content loads it shows the core skeleton. state:
// :state(loading|ready|error|idle|skeleton).

import { AufbauElement }        from './core/index.js';
import { importFile, renderMD } from '@aufbau/import';
import { html, raw as rawHtml } from './core/html.js';
import { dedent }               from './core/utils.js';

const STATES = ['error', 'idle', 'loading', 'ready'];

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

  static source = { tag: 'article' };

  static skeleton = { lines: 4, width: '100%' };

  static styles = `aufbau-reader {
    display: block;

    > article { display: block; min-inline-size: 0; }
  }`;

  constructor () {
    super();
    this._state = 'idle';
  }

  get state () { return this._state; }

  async update () {
    const { format, raw, src } = this.getAttr();
    const source = src || raw || dedent(this.sourceText);

    if (source === this._source && this.state !== 'idle') return super.update();
    this._source = source;

    if (!source) { this._html = ''; return this.finish('idle'); }

    // the status line only replaces nothing. existing content stays until the new one is
    // ready, otherwise a live preview would flicker on every keystroke
    this.setState('loading');
    if (!this._html) super.update();

    try {
      // one pipeline for both paths: importFile dispatches on the extension,
      // renderMD reuses the very same configured markdown compiler
      const markup = src            ? await importFile(src)
                   : format === 'html' ? source
                   :                     await renderMD(source);

      // optional consumer hook — rewrite the parsed markup before it is committed
      // (resolve folder-relative assets, tag links). kept generic so an app reading
      // local files injects its own resolution without re-implementing rendering.
      const transformed = await this.applyTransform(markup);

      // a newer source arrived while this one was rendering, its own pass owns the result
      if (this._source !== source) return this;

      this._html = transformed;
      this.finish('ready');
    } catch (error) {
      if (this._source !== source) return this;
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

  setState (state) {
    this._state = state;
    for (const name of STATES) this.states.toggle(name, name === state);
    // the skeleton only stands in for content that is not there yet, a reload keeps the old text
    this.setSkeleton(state === 'loading' && !this._html);
  }

  finish (state) {
    this.setState(state);
    super.update();
    if (state !== 'loading') this.emit('aufbau-reader-rendered', { state, src: this.getAttr('src') });
    return this;
  }

  render () {
    if (this.state === 'error')   return html`<p role="alert">could not load content.</p>`;

    // importFile/renderMD return trusted, already parsed markup. the <article> is the output itself
    return rawHtml(this._html ?? '');
  }
}

AufbauReader.init();
