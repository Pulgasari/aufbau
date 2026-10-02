// <input-date>
// a date, as an iso date: '2026-09-30'.
//
//   <input-date name="date"></input-date>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="date">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-date', 'date');
