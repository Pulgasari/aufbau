// <input-currency>
// a currency as iso 4217 code: 'EUR'. `currencies` limits the list
//
//   <input-currency name="currency" value="EUR"></input-currency>

import { InputValue } from '../core/InputValue.js';

export class InputCurrency extends InputValue { static type = 'currency'; }

InputCurrency.init('input-currency');
export default InputCurrency;
