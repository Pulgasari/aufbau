// <datalist is="aufbau-datalist">
// a data source for native list= autocompletion, fed by @aufbau/import.

import { AufbauDatalistElement, normalizeOptions } from './core/index.js';
import { importFile } from '@aufbau/import';
import { attrs, html } from './core/html.js';

export default class AufbauDatalist extends AufbauDatalistElement {
  static attr = {
    key      : 'value',
    labelKey : 'label',
    src      : String,
  };

  // no connectedCallback/attributeChangedCallback override, the core lifecycle
  // handles both and calls update()

  async update () {
    const { key, labelKey, src } = this.getAttr();
    if (!src) return this;

    if (src !== this._loadedSrc) {
      this._loadedSrc = src;
      try {
        // @aufbau/import covers json, jsonc, json5, yaml, toml, csv and xml
        this._items = normalizeOptions(await importFile(src), { key, labelKey });
      } catch (error) {
        console.warn(`[aufbau-datalist] could not import data from "${src}":`, error);
        this._items = [];
      }
    }

    return super.update();
  }

  render () {
    return html`${(this._items ?? []).map(item =>
      html`<option ${attrs({ label: item.label === item.value ? false : item.label, value: item.value })}></option>`
    )}`;
  }
}

AufbauDatalist.init({ extends: 'datalist' });
