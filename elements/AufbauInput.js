// <aufbau-input>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

const VARIANT_ICONS = {
  email    : 'lucide:mail',
  password : 'lucide:lock',
  search   : 'bx:search',
  tel      : 'lucide:phone',
  url      : 'lucide:link',
};

export default class AufbauInput extends AufbauElement {
  static attr = {
    icon        : String,
    list        : String,
    placeholder : String,
    type        : 'text',
    value       : String,
  };

  get value ()    { return this.$('input')?.value ?? ''; }
  set value (val) { this.setAttr({ value: val }); }

  onMount () {
    // delegated, so it survives every re-render and is released on disconnect
    this.on('input',  'input', (e, input) => this.emit('aufbau-input',        { value: input.value }));
    this.on('change', 'input', (e, input) => this.emit('aufbau-input-change', { value: input.value }));
  }

  render () {
    const { icon, list, placeholder, type } = this.getAttr();
    const iconName = icon === 'false' ? null : (icon || VARIANT_ICONS[type] || null);

    return html`
      <div class="aufbau-input-wrapper">
        ${iconName && html`<aufbau-icon icon="${iconName}"></aufbau-icon>`}
        <input type="${type}" placeholder="${placeholder ?? ''}" />
      </div>
    `;
  }

  sync () {
    const input = this.$('input');
    if (!input) return;

    // list is an attribute rather than a template hole, interpolating markup
    // into html`` would escape the quotes
    dom.setAttr(input, { list: this.getAttr('list') || false });

    // never write back into the field while the user is typing in it
    if (input !== document.activeElement) dom.setValue(input, this.getAttr('value') ?? '');
  }
}

AufbauInput.init();
