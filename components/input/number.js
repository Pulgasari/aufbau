// <input-number>
// a number.
//
//   <input-number name="number"></input-number>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="number">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-number', 'number');
