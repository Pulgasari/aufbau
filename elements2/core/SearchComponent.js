// @aufbau/elements2/core/SearchComponent.js
// the base of every component that is picked from search hits: a search field
// and the hits as a wrapping row of options. the field only feeds the search,
// the <aufbau-picker> below holds the value. the current value stays among the
// hits, so a new search never drops it.
//
// a subclass answers results(query) with [{ value, label, icon }], sync or async.
// a separate field on purpose: the picker's own search field sits in its shadow
// markup, which is rebuilt whenever the options change.

import '../aufbau/AufbauInput.js';
import '../aufbau/AufbauPicker.js';

import { attrs, html }     from './html.js';
import { AufbauComponent } from './AufbauComponent.js';

const DEBOUNCE = 250;

/** an <aufbau-option> from { value, label, icon } */
function optionElement ({ icon, label, value }) {
  const option = document.createElement('aufbau-option');
  option.setAttribute('value', value);
  if (icon) option.setAttribute('icon', icon);
  option.textContent = label ?? value;
  return option;
}

export class SearchComponent extends AufbauComponent {

  static attr = {
    limit       : { type: Number, default: 64 },
    placeholder : 'search…',
    query       : String,   // the search the element starts with
  };

  static control = 'aufbau-picker';

  // the picker shows icons without labels where the options have icons
  static iconsOnly = false;

  get field () { return this.querySelector(':scope > aufbau-input'); }

  render () {
    return html`
      <aufbau-input type="text"></aufbau-input>
      <aufbau-picker look="segments" ${attrs({ 'icons-only': this.constructor.iconsOnly, value: this.initialValue })}></aufbau-picker>
    `;
  }

  bind () {
    const field = this.field;

    this.mute(field);
    this.on(field, 'input', event => { if (event.target === field) this.search(field.value); });

    // the query attribute only starts the search, what was typed stays across a reconnect
    if (!field.value && this.getAttr('query')) field.value = this.getAttr('query');
    this.load(field.value);
  }

  sync () {
    super.sync();
    this.field?.setAttribute('placeholder', this.getAttr('placeholder') ?? '');
  }

  /** hook, the hits for a query as [{ value, label, icon }] or a promise of them */
  results (query) { return []; }

  /** hook, the entry of the current value, shown before the hits */
  current (value) { return { value }; }

  search (query) {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.load(query), DEBOUNCE);
  }

  // the last request wins, an older answer arriving late is dropped
  async load (query) {
    const request = this._request = (this._request ?? 0) + 1;
    const hits    = await this.results(String(query ?? '').trim());
    if (request !== this._request || !this.control) return;

    const value   = this.value;
    const entries = value ? [this.current(value), ...hits.filter(hit => hit.value !== value)] : hits;
    this.control.replaceChildren(...entries.map(optionElement));
  }

  onUnmount () { clearTimeout(this._timer); }
}

export default SearchComponent;

/** the layout of a search component under its tag: the field above, the hits wrapping below */
export const searchStyles = tag => `${tag} {
  display        : flex;
  flex-direction : column;
  gap            : var(--aufbau-control-gap, 0.5em);

  > aufbau-picker { flex-wrap: wrap; }
}`;
