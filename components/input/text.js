// <input-text>
// a single line of text.
//
//   <input-text name="text"></input-text>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="text">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-text', 'text');
