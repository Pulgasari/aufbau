// <datalist is="aufbau-datalist">

import { AufbauDatalistElement } from './core/index.js';
import { importFile }            from '@aufbau/import';
import { attrs, html }           from '@aufbau/js';

export default class AufbauDatalist extends AufbauDatalistElement {
  static attr = {
    src      : String,
    key      : 'value',
    labelKey : 'label',
  };

  // no connectedCallback/attributeChangedCallback override, the core lifecycle
  // handles both and calls update()

  async update () {
    const { src } = this.getAttr();
    if (!src) return;

    if (src !== this._loadedSrc) {
      this._loadedSrc = src;
      try {
        // @aufbau/import covers json, jsonc, json5, yaml, toml, csv and xml
        this._items = this.normalize(await importFile(src));
      } catch (err) {
        console.warn(`[aufbau-datalist] could not import data from "${src}":`, err);
        this._items = [];
      }
    }

    super.update();
  }

  normalize (data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      // handles wrapped payloads like { items: [...] } or { data: [...] }
      return data.items || data.data || data.results || Object.values(data);
    }
    return [];
  }

  render () {
    const { key, labelKey } = this.getAttr();

    return html`${(this._items ?? []).map(item => {
      if (typeof item !== 'object' || item === null) {
        return html`<option ${attrs({ value: item })}></option>`;
      }
      const value = item[key] ?? item.value ?? Object.values(item)[0];
      return html`<option ${attrs({ value, label: item[labelKey] })}></option>`;
    })}`;
  }
}

AufbauDatalist.init({ extends: 'datalist' });
