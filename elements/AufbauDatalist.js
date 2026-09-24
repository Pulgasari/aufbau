// <aufbau-datalist>
// a data source for native list= autocompletion, fed by @aufbau/import.
//
// autonomous on purpose: the former <datalist is="aufbau-datalist"> is a
// customized built-in, which safari never shipped. the host renders a real
// <datalist> and hands its own id over to it, so <input list="…"> keeps
// pointing at the same name:
//
//   <aufbau-datalist id="cities" src="/data/cities.json" key="name"></aufbau-datalist>
//   <input list="cities">
//
// authored <option> children are kept and listed before the loaded ones.

import { AufbauElement, normalizeOptions } from './core/index.js';
import { importFile }  from '@aufbau/import';
import { attrs, html } from './core/html.js';

export default class AufbauDatalist extends AufbauElement {
  static attr = {
    key      : 'value',
    labelKey : 'label',
    src      : String,
  };

  static styles = `aufbau-datalist { display: none; }`;

  onMount () {
    // the id belongs to the inner datalist, two elements must not share it
    if (this.id) {
      this._listId = this.id;
      this.removeAttribute('id');
    }

    this._authored ??= [...this.querySelectorAll(':scope > option')]
      .map(option => ({ label: option.label, value: option.value }));
  }

  get list () { return this.$(':scope > datalist'); }

  async update () {
    const { key, labelKey, src } = this.getAttr();

    if (src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      try {
        // @aufbau/import covers json, jsonc, json5, yaml, toml, csv and xml
        const items = normalizeOptions(await importFile(src), { key, labelKey });
        if (this._loadedSrc !== src) return this;   // superseded
        this._items = items;
      } catch (error) {
        console.warn(`[aufbau-datalist] could not import data from "${src}":`, error);
        this._items = [];
      }
    }

    return super.update();
  }

  render () {
    const items = [...(this._authored ?? []), ...(this._items ?? [])];

    return html`
      <datalist ${attrs({ id: this._listId })}>
        ${items.map(item => html`<option ${attrs({ label: item.label === item.value ? false : item.label, value: item.value })}></option>`)}
      </datalist>
    `;
  }
}

AufbauDatalist.init();
