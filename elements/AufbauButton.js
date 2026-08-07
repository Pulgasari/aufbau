// <aufbau-button>

import { AufbauElement } from './core/index.js';
import { html, raw as rawHtml } from '@aufbau/js';
import * as dom from '@domina/core';

export default class AufbauButton extends AufbauElement {
  static attr = {
    disabled : Boolean,
    icon     : String,
    label    : String,
    text     : String,
    type     : 'button',
    variant  : 'default',
  };

  onMount () {
    // authored children are the label when no explicit one was given.
    // captured before the first render replaces them
    this._children ??= this.innerHTML.trim();
  }

  render () {
    const { icon, label, text, type, variant } = this.getAttr();
    const content = label || text || this._children || '';

    return html`
      <button type="${type}" class="aufbau-btn variant-${variant}">
        ${icon    && html`<aufbau-icon icon="${icon}"></aufbau-icon>`}
        ${content && html`<span class="btn-content">${rawHtml(content)}</span>`}
      </button>
    `;
  }

  // kept out of render() so toggling disabled does not rebuild the markup
  sync () {
    dom.setAttr(this.$('.aufbau-btn'), { disabled: this.getAttr('disabled') });
  }
}

AufbauButton.init();
