// <input-phone>
// a phone number, typed on the phone keypad
//
//   <input-phone name="phone" autocomplete="tel"></input-phone>

import { InputValue } from '../core/InputValue.js';

export class InputPhone extends InputValue { static type = 'phone'; }

InputPhone.init('input-phone');
export default InputPhone;
