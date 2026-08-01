// <aufbau-checkbox>

import AufbauElement from './AufbauElement.js';

export default class AufbauCheckbox extends AufbauElement {
  static attr = {
    checked       : Boolean,
    disabled      : Boolean,
    indeterminate : Boolean,
    label         : String, 
    value         : String,
  ];

  onMount () {
    this.on('click', () => this.toggle());
  }

  toggle () {
    if (this.hasAttribute('disabled')) return;

    const checked = !this.hasAttribute('checked');
    this.setAttr({ checked });
    this.emit('aufbau-checkbox', { checked, value: this.getAttr('value', String, 'on') });
  }

  update () {
    const { checked, disabled, indeterminate, label } = this.getAttr();
    const state = indeterminate ? 'mixed' : String(checked);

    this.innerHTML = `
      <label class="aufbau-checkbox-wrapper ${disabled ? 'is-disabled' : ''}">
        <button
          type="button"
          role="checkbox"
          aria-checked="${state}"
          class="checkbox-box ${checked ? 'is-checked' : ''} ${indeterminate ? 'is-indeterminate' : ''}"
          ${disabled ? 'disabled' : ''}
        >
          <aufbau-icon icon="${indeterminate ? 'lucide:minus' : 'lucide:check'}"></aufbau-icon>
        </button>
        ${label ? `<span class="checkbox-label">${label}</span>` : ''}
      </label>
    `;
  }
}

AufbauCheckbox.init();
