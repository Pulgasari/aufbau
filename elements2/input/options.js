// @aufbau/elements2/input/options.js
// where the options of an input-* element come from, in this order:
//
//   children   <input-option> (or <option>) inside the element
//   src        a json file, loaded once per address
//   list type  the entries of its type (language, emoji, …). built again when
//              one of the type's attributes, the language or the query changes
//
// the query is what was typed into a search field. a list type that searches
// (emoji, icon) gets it, the others ignore it. loading is async, `onChange`
// repaints once something arrived.

import { importFile }                    from '@aufbau/import';
import { localeOf }                      from '../lib/locale.js';
import { normalizeOptions, readOptions } from '../lib/options.js';

export class OptionSource {

  constructor (host, onChange) {
    this.host     = host;
    this.onChange = onChange;
    this.query    = '';
    this.fetched  = [];   // from src
    this.listed   = [];   // from the list type
  }

  get all () {
    const children = readOptions(this.host);
    return [...children, ...this.fetched, ...this.listed];
  }

  // starts whatever loading is due, cheap when nothing changed
  refresh () {
    this.refreshSrc();
    this.refreshList();
  }

  search (query) {
    this.query = String(query ?? '').trim();
    this.refreshList();
  }

  refreshSrc () {
    const src = this.host.getAttribute('src');
    if (src === this.src) return;

    this.src     = src;
    this.fetched = [];
    if (!src) return;

    const done = options => {
      if (this.src !== src) return;   // the address changed meanwhile
      this.fetched = options;
      this.onChange();
    };

    importFile(src)
      .then(data => done(normalizeOptions(data)))
      .catch(error => {
        console.warn(`[${this.host.localName}] could not load options from "${src}":`, error);
        done([]);
      });
  }

  refreshList () {
    const host = this.host;
    const type = host.valueType;

    if (!type.list) {
      this.key    = '';
      this.listed = [];
      return;
    }

    // everything the entries are made of. the same key, the same entries
    const locale = localeOf(host);
    const parts  = [host.typeName, locale, this.query];
    for (const name of type.attributes ?? []) parts.push(host.getAttribute(name));

    const key = parts.join('|');
    if (key === this.key) return;
    this.key = key;

    const done = options => {
      if (this.key !== key) return;   // a newer request is under way
      this.listed = options;
      this.onChange();
    };

    Promise.resolve(type.list.entries(host, locale, this.query))
      .then(done)
      .catch(error => {
        console.warn(`[${host.localName}] could not build the ${host.typeName} list:`, error);
        done([]);
      });
  }
}
