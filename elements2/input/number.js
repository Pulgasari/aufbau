// <input-number>
// a number. looks: field, stepper, slider; `range` for from..to
//
//   <input-number name="count" min="0" max="10" look="stepper"></input-number>
//   <input-number name="price" range look="slider" max="500"></input-number>

import { InputValue } from '../core/InputValue.js';

export class InputNumber extends InputValue { static type = 'number'; }

InputNumber.init('input-number');
export default InputNumber;
