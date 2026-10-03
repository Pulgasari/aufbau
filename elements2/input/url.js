// <input-url>
// a url. one typed without a scheme gets https:// once the field is left
//
//   <input-url name="site"></input-url>

import { InputValue } from '../core/InputValue.js';

export class InputUrl extends InputValue { static type = 'url'; }

InputUrl.init('input-url');
export default InputUrl;
