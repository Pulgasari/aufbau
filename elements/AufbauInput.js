// <aufbau-input>

import AufbauElement from './AufbauElement.js';

const VARIANT_ICONS = {
  email    : 'lucide:mail',
  password : 'lucide:lock',
  search   : 'bx:search',
  tel      : 'lucide:phone',
  url      : 'lucide:link',
};

export class AufbauInput extends AufbauElement {
  static attr = ['type', 'icon', 'placeholder', 'value', 'list'];

  get value () {
    return this.$('input')?.value || '';
  }

  update () {
    const { type = 'text', icon, placeholder = '', value = '', list = '' } = this.getAttr();
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
