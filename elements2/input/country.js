// <input-country>
// a country as iso 3166-1 code: 'DE', named in the page language.
// `countries` limits the list, flags="false" drops the flags
//
//   <input-country name="country" countries="DE AT CH" look="segments"></input-country>

import { InputValue } from '../core/InputValue.js';

export class InputCountry extends InputValue { static type = 'country'; }

InputCountry.init('input-country');
export default InputCountry;
