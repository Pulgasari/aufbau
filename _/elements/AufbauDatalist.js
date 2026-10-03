// <aufbau-datalist>
// a data source for native list= autocompletion, fed by @aufbau/import.
//
// autonomous on purpose: the former <datalist is="aufbau-datalist"> is a
// customized built-in, which safari never shipped. the host owns one real
// <datalist> and hands its own id over to it, so <input list="…"> keeps
// pointing at the same name:
//
//   <aufbau-datalist id="cities" src="/data/cities.json" key="name"></aufbau-datalist>
//   <input list="cities">
//
// no shadow root here: list= resolves ids in the document, not in a shadow
// tree. the author's <option> children are left alone and only read, the own
// <datalist> is appended once and filled, never rendered over the children.

import { AufbauElement, normalizeOptions } from './core/index.js';
import { importFile } from '@aufbau/import';

export default class AufbauDatalist extends AufbauElement {
  static attr = {
    key      : 'value',
    labelKey : 'label',
    src      : String,
  };

  static styles = `aufbau-datalist { display: none; }`;

  get list () { return this._list; }

  onMount () {
    this._list ??= document.createElement('datalist');

    // the id belongs to the inner datalist, two elements must not share it
    if (this.id) {
      this._list.id = this.id;
      this.removeAttribute('id');
    }

    if (this._list.parentNode !== this) this.append(this._list);
  }

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

  render () { return null; }

  // authored options first, then the loaded ones. rebuilt as nodes, the list is ours alone
  sync () {
    if (!this._list) return;

    const authored = [...this.querySelectorAll(':scope > option')].map(option => ({ label: option.label, value: option.value }));
    const options  = [...authored, ...(this._items ?? [])].map(({ label, value }) => {
      const option = document.createElement('option');
      option.value = value;
      if (label && label !== value) option.label = label;
      return option;
    });

    this._list.replaceChildren(...options);
  }
}

AufbauDatalist.init();
