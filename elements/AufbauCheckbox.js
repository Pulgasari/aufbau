// <aufbau-checkbox>

import AufbauElement from './AufbauElement.js';

export default class AufbauCheckbox extends AufbauElement {
  static attr = {
    checked       : Boolean,
    disabled      : Boolean,
    indeterminate : Boolean,
    label         : String, 
    value         : 'on',
  ];

  onMount () {
    this.on('click', () => this.toggle());
  }

  toggle () {
    const { disabled, checked, value } = this.getAttr();
    if (disabled) return;
    const nextChecked = !checked;
    this.setAttributes({ checked: nextChecked });
    this.emit('aufbau-checkbox', { checked: nextChecked, value });
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

/*
// In AufbauCheckbox.js
export default class AufbauCheckbox extends AufbauElement {
  static formAssociated = true; // Enables native form integration

  constructor () {
    super();
    this.internals = this.attachInternals();
  }

  update () {
    const { checked, value } = this.getAttr();
    
    // Checked -> submits 'on' (or custom value)
    // Unchecked -> null (submits NOTHING in <form>, native behavior)
    this.internals.setFormValue(checked ? value : null);

    // ... rest of rendering logic
  }
}
*/
