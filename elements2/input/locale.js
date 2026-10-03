// <input-locale>
// a locale: 'de-AT', 'Deutsch (Österreich)'. `locales` limits the list
//
//   <input-locale name="locale" value="de-DE"></input-locale>

import { InputValue } from '../core/InputValue.js';

export class InputLocale extends InputValue { static type = 'locale'; }

InputLocale.init('input-locale');
export default InputLocale;
