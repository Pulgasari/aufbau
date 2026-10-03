import { AufbauElement } from '../base/AufbauElement.js';

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

  set label (label) { this.setAttribute('label', label); }
  set value (value) { this.setAttribute('value', value); }

  render () { return null; }
}

InputOption.init('input-option');
export default InputOption;
