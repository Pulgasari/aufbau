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
  }

  get length ()     { return this.value.length; }
  get value  ()     { return super.value; }
  set value  (next) { super.value = asText(next); }

  clear () { super.value = ''; return ''; }

  // the value in another case, the signal itself stays as it is. read through
  // .value, so a render using one of them subscribes
  toCamelCase    () { return str.toCamelCase    (this.value); }
  toConstantCase () { return str.toConstantCase (this.value); }
  toKebabCase    () { return str.toKebabCase    (this.value); }
  toLowerCase    () { return str.toLowerCase    (this.value); }
  toPascalCase   () { return str.toPascalCase   (this.value); }
  toSlugCase     () { return str.toSlugCase     (this.value); }
  toSnakeCase    () { return str.toSnakeCase    (this.value); }
  toTitleCase    () { return str.toTitleCase    (this.value); }
  toUpperCase    () { return str.toUpperCase    (this.value); }
}

const stringSignal = (...args) => new StringSignal(...args);

// :::::: EXPORT

const Callable = callable(StringSignal);

export { Callable as StringSignal, stringSignal };
export default Callable;
