// <aufbau-toggle>

import AufbauElement from './AufbauElement.js';

export class AufbauToggle extends AufbauElement {
  static attr = ['checked', 'disabled', 'label'];

  onMount () {
    this.on('click', () => this.toggle());
  }

  toggle () {
    if (this.hasAttribute('disabled')) return;

    const checked = !this.hasAttribute('checked');
    this.setAttr({ checked });
    this.emit('aufbau-toggle', { checked });
  }

  update () {
    const label = this.getAttr('label', String, '');
    const { checked, disabled } = this.getAttr(Boolean);

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
