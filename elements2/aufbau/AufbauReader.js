import { AufbauElement }        from '../base/index.js';
import { importFile, renderMD } from '@aufbau/import';
import { html, raw as rawHtml } from '../lib/html.js';
import { dedent }               from '../lib/utils.js';

const STATES = ['error', 'idle', 'loading', 'ready'];

export default class AufbauReader extends AufbauElement {
  static attr = {
    format : { type: String, default: 'markdown', values: ['html', 'markdown'] },
    raw    : String,
    src    : String,
  };

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

    this.setState('loading');
    if (!this._html) super.update();

    try {
      const markup = src            ? await importFile(src)
                   : format === 'html' ? source
                   :                     await renderMD(source);

      const transformed = await this.applyTransform(markup);

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

    return rawHtml(this._html ?? '');
  }
}

AufbauReader.init();
