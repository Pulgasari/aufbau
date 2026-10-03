// <input-email>
// an email address.
//
//   <input-email name="email"></input-email>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="email">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-email', 'email');
