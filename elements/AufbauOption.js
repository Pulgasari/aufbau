// <aufbau-option>
// a data element, not a control. it carries one choice and is read by its
// container (<aufbau-picker>, <aufbau-slider marks>, …). it never renders
// itself, and it is never removed from the dom, so options stay live and can
// be added or dropped at runtime.

import { AufbauElement } from './core/index.js';

export default class AufbauOption extends AufbauElement {
  static attr = {
    disabled : Boolean,
    icon     : String,
    label    : String,
    selected : Boolean,
    value    : String,
  };

  static styles = `
    aufbau-option { display: none; }
  `;

  /** label falls back to the text content, so the markup stays readable */
  get label () { return this.getAttr('label') || this.textContent.trim(); }
  get value () { return this.getAttribute('value') ?? this.label; }

  toJSON () {
    const { disabled, icon, selected } = this.getAttr();
    return { disabled, icon, label: this.label, selected, value: this.value };
  }

  // the container repaints on child mutations, nothing to do here
  render () { return null; }
}

AufbauOption.init();
