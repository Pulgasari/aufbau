// <input-time>
// a time of day: '14:30'. looks: field, stepper, slider; `range` for from..to
//
//   <input-time name="opens" step="900000"></input-time>

import { InputValue } from '../core/InputValue.js';

export class InputTime extends InputValue { static type = 'time'; }

InputTime.init('input-time');
export default InputTime;
