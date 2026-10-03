// <input-datetime>
// a date and a time of day, local: '2026-10-03T14:30'. `range` for from..to
//
//   <input-datetime name="start"></input-datetime>

import { InputValue } from '../core/InputValue.js';

export class InputDatetime extends InputValue { static type = 'datetime'; }

InputDatetime.init('input-datetime');
export default InputDatetime;
