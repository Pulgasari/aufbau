// @aufbau/components/core/InputComponent.js
// the base of every component over one <aufbau-input>. the type is the value
// domain of the input, the component adds what the domain needs on top.

import '@aufbau/elements/AufbauInput.js';

import { attrs, html }     from '@aufbau/elements/core/html.js';
import { AufbauComponent } from './AufbauComponent.js';
import { define }          from './names.js';

export class InputComponent extends AufbauComponent {

  static attr = {
    autocomplete : String,
    look         : { type: String, default: 'field', values: ['field', 'stepper', 'swatch'] },
    max          : String,
    maxlength    : Number,
    min          : String,
    minlength    : Number,
    pattern      : String,
    placeholder  : String,
    step         : Number,
  };

  static control = 'aufbau-input';
  static forward = ['autocomplete', 'look', 'max', 'maxlength', 'min', 'minlength', 'pattern', 'placeholder', 'step'];

  // the aufbau-input type, fixed per component
  static type = 'text';

  render () {
    return html`<aufbau-input ${attrs({ type: this.constructor.type, value: this.initialValue })}></aufbau-input>`;
  }
}

/**
 * a component that is an <aufbau-input> of one type and nothing more. `look`
 * sets the default look, e.g. stepper for a year
 */
export function defineInput (name, type, { look } = {}) {
  class Input extends InputComponent {
    static type = type;
  }

  if (look) Input.attr = { look: { type: String, default: look, values: ['field', 'stepper', 'swatch'] } };

  return define(name, Input);
}

export default InputComponent;
