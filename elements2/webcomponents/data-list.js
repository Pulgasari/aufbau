import { AufbauElement }    from '@aufbau/element';
import { normalizeOptions } from '../lib/options.js';
import { importFile }       from '@aufbau/import';

export default class DataList extends AufbauElement {
  static attr = {
    key      : 'value',
    labelKey : 'label',
    src      : String,
  };

  static styles = `data-list { display: none; }`;

  get list () { return this._list; }

  onConnected () {
    this._list ??= document.createElement('datalist');

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
        const items = normalizeOptions(await importFile(src), { key, labelKey });
        if (this._loadedSrc !== src) return this;   // superseded
        this._items = items;
      } catch (error) {
        console.warn(`[data-list] could not import data from "${src}":`, error);
        this._items = [];
      }
    }

    return super.update();
  }

  render () { return null; }

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

DataList.init();
