// <input-color>
// a color, as a hex string: '#ff8800'.
//
//   <input-color name="color"></input-color>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="color">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-color', 'color', { look: 'swatch' });
