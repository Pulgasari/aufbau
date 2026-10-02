// <input-time>
// a time of day, as 'hh:mm'.
//
//   <input-time name="time"></input-time>
//
// a thin component: the value, the looks and the form behaviour are <aufbau-input type="time">'s.

import { defineInput } from '../core/InputComponent.js';

export default defineInput('input-time', 'time');
