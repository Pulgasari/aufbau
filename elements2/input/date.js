// <input-date>
// a date: '2026-10-03'. looks: field, stepper, slider; `range` for from..to
//
//   <input-date name="from"></input-date>
//   <input-date name="trip" range></input-date>

import { InputValue } from '../core/InputValue.js';

export class InputDate extends InputValue { static type = 'date'; }

InputDate.init('input-date');
export default InputDate;
