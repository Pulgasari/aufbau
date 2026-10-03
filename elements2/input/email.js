// <input-email>
// an email address. `multiple` for several, as chips
//
//   <input-email name="mail" autocomplete="email"></input-email>

import { InputValue } from '../core/InputValue.js';

export class InputEmail extends InputValue { static type = 'email'; }

InputEmail.init('input-email');
export default InputEmail;
