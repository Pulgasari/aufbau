// <input-year>
// a calendar year. looks: stepper, field, slider; `range` for from..to
//
//   <input-year name="year" value="2026"></input-year>

import { InputValue } from '../core/InputValue.js';

export class InputYear extends InputValue { static type = 'year'; }

InputYear.init('input-year');
export default InputYear;
