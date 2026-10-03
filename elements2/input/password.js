// <input-password>
// a password, with a button that shows it while it is on (actions="reveal")
//
//   <input-password name="password" autocomplete="current-password"></input-password>

import { InputValue } from '../core/InputValue.js';

export class InputPassword extends InputValue { static type = 'password'; }

InputPassword.init('input-password');
export default InputPassword;
