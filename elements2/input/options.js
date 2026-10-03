// @aufbau/elements2/input/options.js
// where the options of an input-* element come from, in this order:
//
//   children   <input-option> (or <option>) inside the element
//   src        a json file, loaded once per address
//   list type  the entries of its type (language, country, …), built again
//              whenever its attributes or the language change
//
// loading is async, `onChange` repaints once something arrived.

import { importFile }                    from '@aufbau/import';
import { normalizeOptions, readOptions } from '../core/options.js';
import { localeOf }                      from '../core/locale.js';

export class OptionSource {

  constructor (host, onChange) {
    this.host     = host;
    this.onChange = onChange;
    this.fetched  = null;   // from src
    this.listed   = null;   // from the list type
  }

  get all () { return [...readOptions(this.host), ...(this.fetched ?? []), ...(this.listed ?? [])]; }

  /** starts whatever loading is due, cheap when nothing changed */
  refresh () {
    this.refreshSrc();
    this.refreshList();
  }

  refreshSrc () {
    const src = this.host.getAttribute('src');
    if (src === this.src) return;

    this.src     = src;
    this.fetched = null;
    if (!src) return;

    importFile(src)
      .then(data => normalizeOptions(data))
      .catch(error => { console.warn(`[${this.host.localName}] could not load options from "${src}":`, error); return []; })
      .then(options => { if (this.src === src) { this.fetched = options; this.onChange(); } });
  }

  refreshList () {
    const type = this.host.valueType;
    const host = this.host;
    const key  = type.list ? [host.typeName, localeOf(host), ...(type.attributes ?? []).map(name => host.getAttribute(name))].join('|') : '';
    if (key === (this.key ?? '')) return;

    this.key    = key;
    this.listed = null;
    if (!type.list) return;

    Promise.resolve(type.list.entries(host, localeOf(host)))
      .catch(error => { console.warn(`[${host.localName}] could not build the ${host.typeName} list:`, error); return []; })
      .then(options => { if (this.key === key) { this.listed = options; this.onChange(); } });
  }
}
