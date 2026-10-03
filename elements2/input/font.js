// <input-font>
// a font of @aufbau/webfonts by its id: 'manrope'. `categories` limits the list
//
//   <input-font name="font" categories="sans serif"></input-font>

import { InputValue } from '../core/InputValue.js';

export class InputFont extends InputValue { static type = 'font'; }

InputFont.init('input-font');
export default InputFont;
