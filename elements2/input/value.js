// <input-value>
// any value: `type` says which (text, number, date, color, language, bool, …),
// `look` how it is entered. the input-* presets are this element with a fixed
// type. without a type, option children make it a choice.
//
//   <input-value name="speed" type="number" look="slider" max="10"></input-value>
//   <input-value name="viewmode" look="segments">
//     <input-option value="grid" icon="lucide:grid-2x2">grid</input-option>
//     <input-option value="list" icon="lucide:list">list</input-option>
//   </input-value>

import { InputValue } from '../core/InputValue.js';

InputValue.init('input-value');
export default InputValue;
