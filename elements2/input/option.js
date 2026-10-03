// <input-option>
// a data element, not a control: one choice of the input-* element around it.
// it never renders, and it stays in the dom, so options can be added and
// dropped at runtime. the label falls back to the text content.
//
//   <input-option value="de" icon="circle-flags:de" selected>Deutsch</input-option>

import { AufbauElement } from '../core/index.js';

export class InputOption extends AufbauElement {
  static attr = {
    disabled : Boolean,
    icon     : String,
    label    : String,
    selected : Boolean,
    value    : String,
  };

  static styles = `input-option { display: none; }`;

  get label () { return this.getAttr('label') || this.textContent.trim(); }
  get value () { return this.getAttribute('value') ?? this.label; }

  // written through to the attribute: a framework sets them as properties
  set label (label) { this.setAttribute('label', label); }
  set value (value) { this.setAttribute('value', value); }

  render () { return null; }
}

InputOption.init('input-option');
export default InputOption;
