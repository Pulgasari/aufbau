// <aufbau-switch>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauSwitch extends AufbauElement {
  static attr = {
    value : String,
    mode  : { type: String, default: 'buttons', values: ['buttons', 'dropdown'] }
  };

  onMount () {
    // the source options are children of this element and get wiped by the first
    // render, so they have to be read before update() runs
    this._options = this.readOptions();

    this.on('click', '[data-value]', (e, btn) => this.select(btn.dataset.value));
    this.on('change', '.aufbau-switch-select', (e, select) => this.select(select.value));
  }

  readOptions () {
    return this.$$('option, [data-value]').map(opt => ({
      value : opt.getAttribute('value') || opt.dataset.value || opt.textContent.trim(),
      label : opt.textContent.trim()
    }));
  }

  select (value) {
    if (value === this.getAttr('value')) return;
    this.setAttr({ value });
    this.emit('aufbau-switch', { value });
  }

  render () {
    const { mode } = this.getAttr();
    const options  = this._options ??= this.readOptions();

    // no selected/is-selected here, that state is applied in sync()
    if (mode === 'dropdown') {
      return html`
        <select class="aufbau-switch-select">
          ${options.map(opt => html`<option value="${opt.value}">${opt.label}</option>`)}
        </select>
      `;
    }

    return html`
      <div class="aufbau-switch-group" role="radiogroup">
        ${options.map(opt => html`
          <button type="button" data-value="${opt.value}" class="switch-btn">${opt.label}</button>
        `)}
      </div>
    `;
  }

  sync () {
    const { value } = this.getAttr();

    const select = this.$('.aufbau-switch-select');
    if (select) { dom.setValue(select, value); return; }

    for (const btn of this.$$('.switch-btn')) {
      const active = btn.dataset.value === value;
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-checked', String(active));
    }
  }
}

AufbauSwitch.init();
