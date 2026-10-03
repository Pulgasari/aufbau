// <input-chips>
// short texts, typed one by one and shown as chips: 'red,green'. the same as
// <input-text multiple>. enter or a comma adds what was typed, backspace in the
// empty field takes the last one back. every value is one FormData entry.
//
//   <input-chips name="tags" value="red,green"></input-chips>

import { InputValue } from '../core/InputValue.js';

export class InputChips extends InputValue {
  static type = 'text';

  static attr = {
    multiple : { type: Boolean, default: true },
  };
}

InputChips.init('input-chips');
export default InputChips;
