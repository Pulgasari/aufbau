// <input-text>
// a line of text. `multiple` for several, as chips
//
//   <input-text name="title" placeholder="title"></input-text>
//   <input-text name="tags" multiple></input-text>

import { InputValue } from '../core/InputValue.js';

export class InputText extends InputValue { static type = 'text'; }

InputText.init('input-text');
export default InputText;
