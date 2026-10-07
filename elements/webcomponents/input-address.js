import './input/tags.js';

import { AufbauControlElement } from '@aufbau/element';
import { attrs, html }          from '../lib/html.js';
import { localeOf }             from '../lib/locale.js';

// a postal address: street, postcode, city, region and country, in the order
// the country writes them. the value is json, a form gets one entry per part:
// name[street], name[postcode], …
const PARTS = ['street', 'postcode', 'city', 'region', 'country'];

const PLACEHOLDERS = { city: 'city', postcode: 'postcode', region: 'state / region', street: 'street and number' };

// country -> how its lines go. the rest writes postcode before city
const FORMATS = {
  AU: 'city-region-postcode', CA: 'city-region-postcode', US: 'city-region-postcode',
  GB: 'city-postcode', IE: 'city-postcode',
};

const EMPTY = () => Object.fromEntries(PARTS.map(part => [part, '']));

export default class InputAddress extends AufbauControlElement {
  static shadow = { delegatesFocus: true };

  static styles = `
    :host {
      display               : grid;
      gap                   : --space(small);
      grid-template-areas   : "street street" "postcode city" "country country";
      grid-template-columns : minmax(5em, 1fr) 3fr;
    }

    :host([data-format="city-region-postcode"]) {
      grid-template-areas   : "street street street" "city region postcode" "country country country";
      grid-template-columns : 3fr 2fr minmax(5em, 1fr);
    }

    :host([data-format="city-postcode"]) {
      grid-template-areas   : "street" "city" "postcode" "country";
      grid-template-columns : 1fr;
    }

    [part="region"] { display: none; }
    :host([data-format="city-region-postcode"]) [part="region"] { display: inline-flex; }

    ${PARTS.map(part => `[part="${part}"] { grid-area: ${part}; min-inline-size: 0; }`).join('\n    ')}
  `;

  parseValue (raw) {
    try   { return { ...EMPTY(), ...JSON.parse(raw || '{}') }; }
    catch { return EMPTY(); }
  }

  formatValue (value) {
    const parts = { ...EMPTY(), ...(typeof value === 'string' ? this.parseValue(value) : value) };
    return Object.values(parts).some(Boolean) ? JSON.stringify(parts) : '';
  }

  // one form entry per part, so a server reads it like separate fields
  get formValue () {
    const value = this.value;
    if (!Object.values(value).some(Boolean)) return null;
    const data = new FormData;
    for (const part of PARTS) data.append(`${this.name || 'address'}[${part}]`, value[part]);
    return data;
  }

  // the country of the value, else the region of the language
  get country () {
    const own = this.value.country;
    if (own) return own.toUpperCase();
    try   { return new Intl.Locale(localeOf(this)).maximize().region ?? ''; }
    catch { return ''; }
  }

  onConnected () {
    // the parts report inside the shadow root, the address reports outside
    this.$(this.root).on('change', event => {
      const part = event.target?.getAttribute?.('part');
      if (!PARTS.includes(part)) return;
      event.stopPropagation();
      this.commit({ ...this.value, [part]: event.target.value ?? '' });
    });
    this.$(this.root).on('input', event => event.stopPropagation());
  }

  // the markup holds no values, so a change does not rebuild the fields under the caret
  render () {
    const { disabled, readonly, required } = this.getAttr();
    const flags = { disabled, readonly };

    return html`
      ${['street', 'postcode', 'city', 'region'].map(part => html`
        <input-text part="${part}" ${attrs({ ...flags, 'aria-label': PLACEHOLDERS[part], placeholder: PLACEHOLDERS[part], required: required && part !== 'region' })}></input-text>
      `)}
      <input-country part="country" ${attrs({ ...flags, 'aria-label': 'country' })}></input-country>
    `;
  }

  sync () {
    const value = { ...this.value, country: this.value.country || this.country };
    for (const part of PARTS) {
      const field = this.root.querySelector(`[part="${part}"]`);
      if (field && (field.value ?? '') !== value[part]) field.value = value[part];
    }
    this.dataset.format = FORMATS[this.country] ?? 'postcode-city';
  }
}

InputAddress.init();
