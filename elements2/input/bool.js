// <input-bool>
// on or off. submits `value` (or 'on') when checked, nothing when not, like a
// native checkbox.
//
//   <input-bool name="dark" checked></input-bool>
//   <input-bool name="agree" look="checkbox"></input-bool>
//
// a thin component: the state, the looks and the form behaviour are <aufbau-toggle>'s.

import '../aufbau/AufbauToggle.js';

import { attrs, html }     from '../core/html.js';
import { AufbauComponent } from '../core/AufbauComponent.js';

export class InputBool extends AufbauComponent {

  static attr = {
    checked : Boolean,
    look    : { type: String, default: 'switch', values: ['switch', 'checkbox', 'button'] },
  };

  static control = 'aufbau-toggle';
  static forward = ['look'];

  get checked () { return this.control?.checked ?? this.hasAttribute('checked'); }

  set checked (checked) {
    if (this.control) this.control.checked = checked;
    else this.toggleAttribute('checked', Boolean(checked));
  }

  render () {
    const checked = this._initialChecked ??= this.hasAttribute('checked');
    return html`<aufbau-toggle ${attrs({ checked, value: this.initialValue })}></aufbau-toggle>`;
  }

  onAttributeChange (name, oldValue, newValue) {
    super.onAttributeChange(name, oldValue, newValue);
    if (name === 'checked' && this.control) this.control.checked = newValue != null;
  }
}

InputBool.init('input-bool');

export default InputBool;
