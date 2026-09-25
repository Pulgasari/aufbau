// @aufbau/signals/StringSignal.js

// :::::: IMPORT

import { BaseSignal, callable } from './BaseSignal.js';
import str from '@pulgasari/str';

// :::::: HELPERS

const asText = value => value == null ? '' : String(value);

// :::::: MAIN

class StringSignal extends BaseSignal {

  constructor (value = '') {
    super(asText(value));

    this.toCamelCase  = str.toCamelCase;
    this.toKebabCase  = str.toKebabCase;
    this.toPascalCase = str.toPascalCase;
    this.toSlugCase   = str.toSlugCase;
  }

  get length ()     { return this.value.length; }
  get value  ()     { return super.value; }
  set value  (next) { super.value = asText(next); }

  clear () { super.value = ''; return ''; }
}

const stringSignal = (...args) => new StringSignal(...args);

// :::::: EXPORT

const Callable = callable(StringSignal);

export { Callable as StringSignal, stringSignal };
export default Callable;
