// <input-year>
// a calendar year, as an integer: '2026'.
//
//   <input-year name="year"></input-year>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="year">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-year', 'year', { look: 'stepper' });
