// <input-password>
// a password, with a button that shows it in plain text while pressed on.
//
//   <input-password name="password" autocomplete="current-password"></input-password>

import '@aufbau/elements/AufbauToggle.js';

import { attrs, html }    from '@aufbau/elements/core/html.js';
import { InputComponent } from '../core/InputComponent.js';
import { define, tagOf }  from '../core/names.js';

const ICONS = { hidden: 'lucide:eye', shown: 'lucide:eye-off' };

export class InputPassword extends InputComponent {

  static type = 'password';

  static styles () {
    return `${tagOf('input-password')} {
      align-items : center;
      display     : inline-flex;
      gap         : var(--aufbau-control-gap, 0.5em);

      > aufbau-input { flex: 1 1 auto; }
    }`;
  }

  get reveal () { return this.querySelector(':scope > aufbau-toggle'); }

  render () {
    return html`
      <aufbau-input ${attrs({ type: 'password', value: this.initialValue })}></aufbau-input>
      <aufbau-toggle look="button" aria-label="show password" ${attrs({ icon: ICONS.hidden, 'icon-checked': ICONS.shown })}></aufbau-toggle>
    `;
  }

  // the toggle is no value of the component. the input keeps its value across the type switch
  bind () {
    const reveal = this.reveal;
    this.mute(reveal);
    this.on(reveal, 'change', () => this.control?.setAttribute('type', reveal.checked ? 'text' : 'password'));
  }
}

define('input-password', InputPassword);

export default InputPassword;
