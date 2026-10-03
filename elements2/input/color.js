// <input-color>
// a color as hex: '#3355ff'. looks: swatch, field, slider (the hue)
//
//   <input-color name="accent" value="#3355ff"></input-color>

import { InputValue } from '../core/InputValue.js';

export class InputColor extends InputValue { static type = 'color'; }

InputColor.init('input-color');
export default InputColor;
