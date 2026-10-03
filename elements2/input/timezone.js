// <input-timezone>
// an iana time zone: 'Europe/Berlin', listed with its current offset.
// `zones` limits the list
//
//   <input-timezone name="zone" value="Europe/Berlin"></input-timezone>

import { InputValue } from '../core/InputValue.js';

export class InputTimezone extends InputValue { static type = 'timezone'; }

InputTimezone.init('input-timezone');
export default InputTimezone;
