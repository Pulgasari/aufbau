import './data-tree.js';
import './data-node.js';

import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// a json file as a tree to unfold. `depth` levels start open. `value` takes
// data that is already there instead of `src`
const preview = value =>
    Array.isArray(value)              ? `[${value.length}]`
  : value && typeof value === 'object' ? `{${Object.keys(value).length}}`
  :                                      JSON.stringify(value);

export default class MediaJson extends AufbauElement {
  static attr = {
    depth : 1,
    label : String,
    src   : String,
  };

  static styles = `media-json {
    display     : block;
    font-family : var(--font-code, ui-monospace, monospace);
    font-size   : 0.9em;

    &[failed]::before { content: 'not json'; opacity: 0.6; }
  }`;

  set value (data) { this._data = data; this._loaded = null; this.invalidate().update(); }
  get value ()     { return this._data; }

  async load () {
    const src = this.getAttr('src');
    if (!src || src === this._loaded) return;
    this._loaded = src;

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`${response.status} ${src}`);
      this._data = await response.json();
      this.removeAttribute('failed');
    }
    catch (error) {
      this._data = undefined;
      this.setAttribute('failed', '');
      console.warn(`[media-json] ${error.message}`);
    }
    this.invalidate().update();
  }

  nodes (value, level) {
    const entries = Array.isArray(value) ? value.map((item, index) => [index, item]) : Object.entries(value);
    return entries.map(([key, item]) => {
      const nested = item && typeof item === 'object';
      return html`<data-node ${attrs({ expanded: nested && level < this.getAttr('depth'), label: `${key}: ${preview(item)}` })}>${nested ? this.nodes(item, level + 1) : ''}</data-node>`;
    });
  }

  render () {
    const data = this._data;
    if (data === undefined) return '';
    if (!data || typeof data !== 'object') return html`<code>${JSON.stringify(data)}</code>`;
    return html`<data-tree ${attrs({ 'aria-label': this.getAttr('label') })}>${this.nodes(data, 0)}</data-tree>`;
  }

  sync () { this.load(); }
}

MediaJson.init();
