// <aufbau-input>

import { AufbauElement } from './core/index.js';

const VARIANT_ICONS = {
  email    : 'lucide:mail',
  password : 'lucide:lock',
  search   : 'bx:search',
  tel      : 'lucide:phone',
  url      : 'lucide:link',
};

export default class AufbauInput extends AufbauElement {
  static attr = ['type', 'icon', 'placeholder', 'value', 'list'];
  static attr = {
    icon  : String,
    list  : String,
    placeholder : String,
    type  : 'text',
    value : String,

  get value () {
    return this.$('input')?.value || '';
  }

  update () {
    const { icon, list, placeholder, type, value } = this.getAttr();
    const iconName = icon === 'false' ? null : (icon || VARIANT_ICONS[type] || null);

    this.innerHTML = `
      <div class="aufbau-input-wrapper">
        ${iconName ? `<aufbau-icon icon="${iconName}"></aufbau-icon>` : ''}
        <input type="${type}" placeholder="${placeholder}" value="${value}" ${list ? `list="${list}"` : ''} />   
      </div>
    `;

    this.$('input')?.on('input', (e) => this.emit('aufbau-input', { value: e.target.value }));
  }
}

AufbauInput.init();
