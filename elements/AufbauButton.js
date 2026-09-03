// <aufbau-button>

import { AufbauElement } from './core/index.js';
import { html, raw as rawHtml } from './core/html.js';
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

  static styles = `
    aufbau-button { display: inline-block; }

    aufbau-button .aufbau-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--aufbau-control-gap, 0.5em);
      inline-size: 100%;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    aufbau-button .aufbau-btn:disabled { cursor: not-allowed; opacity: 0.5; }
    aufbau-button .btn-content { line-height: 1.2; }
  `;

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
