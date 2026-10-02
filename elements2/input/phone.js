// <input-phone>
// a phone number, the native tel input.
//
//   <input-phone name="phone"></input-phone>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="phone">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-phone', 'phone');
