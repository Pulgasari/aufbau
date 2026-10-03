// @aufbau/elements2/input/tags.js
// every input-* element that is a type and nothing more. this one file defines
// all of them: <input-number> is <input-value type="number">.
//
//   <input-value name="speed" type="number" look="slider"></input-value>
//   <input-number name="count" look="stepper" min="0" max="10"></input-number>

import { Input } from './Input.js';

const PRESETS = {
  'input-bool'     : 'bool',
  'input-color'    : 'color',
  'input-country'  : 'country',
  'input-currency' : 'currency',
  'input-date'     : 'date',
  'input-datetime' : 'datetime',
  'input-duration' : 'duration',
  'input-email'    : 'email',
  'input-emoji'    : 'emoji',
  'input-font'     : 'font',
  'input-hotkey'   : 'hotkey',
  'input-icon'     : 'icon',
  'input-language' : 'language',
  'input-locale'   : 'locale',
  'input-number'   : 'number',
  'input-password' : 'password',
  'input-pattern'  : 'pattern',
  'input-phone'    : 'phone',
  'input-search'   : 'search',
  'input-slug'     : 'slug',
  'input-text'     : 'text',
  'input-time'     : 'time',
  'input-timezone' : 'timezone',
  'input-unit'     : 'unit',
  'input-url'      : 'url',
  'input-year'     : 'year',
};

/** the class of every tag defined here */
export const ELEMENTS = { 'input-value': Input };

for (const [tag, type] of Object.entries(PRESETS)) ELEMENTS[tag] = class extends Input { static type = type; };

// short texts as chips, the same as <input-text multiple>
ELEMENTS['input-chips'] = class extends Input {
  static attr = { multiple: { type: Boolean, default: true } };
  static type = 'text';
};

for (const [tag, Element] of Object.entries(ELEMENTS)) Element.init(tag);

export const TAGS = Object.keys(ELEMENTS);
