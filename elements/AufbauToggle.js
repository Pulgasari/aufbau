// <aufbau-toggle>

import { AufbauElement } from './core/index.js';

export default class AufbauToggle extends AufbauElement {
  static attr = {
    checked  : Boolean,
    disabled : Boolean,
    label    : String
  };

  onMount () {
    this.on('click', () => this.toggle());
  }

  toggle () {
    const { disabled, checked } = this.getAttr();
    if (disabled) return;

    const nextChecked = !checked;
    this.setAttr({ checked: nextChecked });
    this.emit('aufbau-toggle', { checked: nextChecked });
  }

  update () {
    const { checked, disabled, label } = this.getAttr();

    this.innerHTML = `
      <button
        type="button"
        role="switch"
        aria-checked="${checked}"
        class="aufbau-toggle-btn ${checked ? 'is-active' : ''}"
        ${disabled ? 'disabled' : ''}
      >
        <span class="thumb"></span>
      </button>
      ${label ? `<span class="toggle-label">${label}</span>` : ''}
    `;
  }
}

AufbauToggle.init();
