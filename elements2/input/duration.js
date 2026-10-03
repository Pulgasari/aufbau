// <input-duration>
// an amount with a unit: '2s', '150ms'. looks: field, stepper, slider
//
//   <input-duration name="delay" look="slider" max="5"></input-duration>

import { InputValue } from '../core/InputValue.js';

export class InputDuration extends InputValue { static type = 'duration'; }

InputDuration.init('input-duration');
export default InputDuration;
