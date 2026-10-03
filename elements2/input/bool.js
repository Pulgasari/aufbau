// <input-bool>
// on or off. 'true' when on, nothing is submitted when off.
// looks: switch, checkbox, button
//
//   <input-bool name="dark" checked label="dark mode"></input-bool>
//   <input-bool name="agree" look="checkbox"></input-bool>

import { InputValue } from '../core/InputValue.js';

export class InputBool extends InputValue { static type = 'bool'; }

InputBool.init('input-bool');
export default InputBool;
