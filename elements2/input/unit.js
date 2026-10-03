// <input-unit>
// a unit as Intl names it: 'kilometer'. `units` limits the list
//
//   <input-unit name="unit" units="meter kilometer mile" look="segments"></input-unit>

import { InputValue } from '../core/InputValue.js';

export class InputUnit extends InputValue { static type = 'unit'; }

InputUnit.init('input-unit');
export default InputUnit;
