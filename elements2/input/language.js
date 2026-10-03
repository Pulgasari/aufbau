// <input-language>
// a language as bcp 47 tag: 'de', 'pt-BR'. named in the page language and
// in its own (native="false" drops that). `languages` limits the list
//
//   <input-language name="lang" languages="de en fr" look="segments"></input-language>

import { InputValue } from '../core/InputValue.js';

export class InputLanguage extends InputValue { static type = 'language'; }

InputLanguage.init('input-language');
export default InputLanguage;
