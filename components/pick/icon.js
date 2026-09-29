// <pick-icon>
// an icon, as an iconify id: 'bx:search'. a search field over the iconify api
// and the hits as a row of icons to pick from.
//
//   <pick-icon name="icon" value="lucide:star"></pick-icon>
//   <pick-icon prefixes="lucide bx" limit="96" query="arrow"></pick-icon>
//
// the value and the form behaviour are <aufbau-picker>'s. the current value
// stays among the hits, so a new search never drops it.

import '@aufbau/elements/AufbauInput.js';
import '@aufbau/elements/AufbauPicker.js';

import { attrs, html }     from '@aufbau/elements/core/html.js';
import { AufbauComponent } from '../core/AufbauComponent.js';
import { define, tagOf }   from '../core/names.js';

const API      = 'https://api.iconify.design/search';
const DEBOUNCE = 250;

/** iconify ids for a query, [] when there is none or the api fails */
async function searchIcons ({ limit, prefixes, query }) {
  if (!query) return [];

  const params = new URLSearchParams({ limit: String(limit), query });
  if (prefixes?.trim()) params.set('prefixes', prefixes.trim().split(/\s+/).join(','));

  try {
    const response = await fetch(`${API}?${params}`);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return (await response.json()).icons ?? [];
  } catch (error) {
    console.warn(`[${tagOf('pick-icon')}] icon search failed:`, error);
    return [];
  }
}

const iconOption = id => {
  const option = document.createElement('aufbau-option');
  option.setAttribute('icon', id);
  option.setAttribute('value', id);
  option.textContent = id;
  return option;
};

export class PickIcon extends AufbauComponent {

  static attr = {
    limit       : { type: Number, default: 64 },
    placeholder : 'search icons…',
    prefixes    : String,   // space separated iconify collections, all when absent
    query       : String,   // the search the element starts with
  };

  static control = 'aufbau-picker';

  static styles () {
    return `${tagOf('pick-icon')} {
      display        : flex;
      flex-direction : column;
      gap            : var(--aufbau-control-gap, 0.5em);

      > aufbau-picker { flex-wrap: wrap; }
    }`;
  }

  get field () { return this.querySelector('aufbau-input'); }

  render () {
    return html`
      <aufbau-input type="text"></aufbau-input>
      <aufbau-picker look="segments" icons-only ${attrs({ value: this.initialValue })}></aufbau-picker>
    `;
  }

  onRender () {
    const field = this.field;

    // the field only feeds the search, its events are no value of the component
    this.mute(field);
    this.on(field, 'input', event => { if (event.target === field) this.search(field.value); });

    const query = this.getAttr('query') ?? '';
    if (query) field.value = query;
    this.load(query);
  }

  sync () {
    super.sync();
    this.field?.setAttribute('placeholder', this.getAttr('placeholder') ?? '');
  }

  search (query) {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.load(query), DEBOUNCE);
  }

  // the last request wins, an older answer arriving late is dropped
  async load (query) {
    const request = this._request = (this._request ?? 0) + 1;
    const { limit, prefixes } = this.getAttr();
    const icons = await searchIcons({ limit, prefixes, query: String(query ?? '').trim() });
    if (request !== this._request || !this.control) return;

    const current = this.value;
    const ids     = current ? [current, ...icons.filter(id => id !== current)] : icons;
    this.control.replaceChildren(...ids.map(iconOption));
  }

  onUnmount () { clearTimeout(this._timer); }
}

define('pick-icon', PickIcon);

export default PickIcon;
