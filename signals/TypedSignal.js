// @aufbau/signals/TypedSignal.js
// the allrounder: one factory for every signal type, so nobody has to import each
// type by hand.
//
//   typedSignal({ type: 'bool', value: false })
//   typedSignal({ type: 'enum', value: 'grid', values: ['grid', 'list'] })
//   typedSignal({ type: Set, value: ['a'] })
//   typedSignal({ type: 'number', value: 3, min: 0, max: 10, step: 1 })
//   typedSignal({ value: 'hello' })                        // no type: read off the value
//   typedSignal({ type: 'string', value: '', key: 'app:title', storage: 'local' })
//
// the argument is always a spec, never the value itself. that is what keeps a
// plain object value ({ x: 0, y: 0 }) from being mistaken for config.

import BaseSignal   from './BaseSignal.js';
import BoolSignal   from './BoolSignal.js';
import EnumSignal   from './EnumSignal.js';
import MapSignal    from './MapSignal.js';
import NumberSignal from './NumberSignal.js';
import RecordSignal from './RecordSignal.js';
import ScalarSignal from './ScalarSignal.js';
import SetSignal    from './SetSignal.js';
import StringSignal from './StringSignal.js';

import { persistSignal } from './persistence.js';
import { isPlainObject } from './shared.js';

// :::::: TYPES
// a type is a lowercase name, the native constructor where one fits, or the
// signal class itself. all three land on the same class.

const BY_NAME = {
  bool    : BoolSignal,
  boolean : BoolSignal,
  enum    : EnumSignal,
  map     : MapSignal,
  number  : NumberSignal,
  record  : RecordSignal,
  scalar  : ScalarSignal,
  set     : SetSignal,
  string  : StringSignal,
};

const BY_NATIVE = new Map([
  [Boolean, BoolSignal],
  [Map,     MapSignal],
  [Number,  NumberSignal],
  [Object,  RecordSignal],
  [Set,     SetSignal],
  [String,  StringSignal],
]);

// anything standing on BaseSignal counts, the exported callable types and
// subclasses of them alike
const isSignalType = type => typeof type === 'function' && (type === BaseSignal || type.prototype instanceof BaseSignal);

export const TYPE_NAMES = Object.keys(BY_NAME);

export const resolveType = type =>
    typeof type === 'string' ? BY_NAME[type.toLowerCase()]
  : BY_NATIVE.get(type) ?? (isSignalType(type) ? type : undefined);

// without a type the value decides. an allow list makes it an enum
const inferType = ({ value, values }) =>
    values                     ? EnumSignal
  : typeof value === 'boolean' ? BoolSignal
  : typeof value === 'number'  ? NumberSignal
  : typeof value === 'string'  ? StringSignal
  : value instanceof Map       ? MapSignal
  : value instanceof Set       ? SetSignal
  : isPlainObject(value)       ? RecordSignal
  :                              ScalarSignal;

// :::::: FACTORY

/**
 * @param {object}  spec
 * @param {*}       [spec.type]     name, native constructor or signal class. read off the value when absent
 * @param {*}       [spec.value]
 * @param {Array}   [spec.values]   the allow list of an enum
 * @param {number}  [spec.min]      the bounds and step of a number
 * @param {number}  [spec.max]
 * @param {number}  [spec.step]
 * @param {string}  [spec.key]      persists the signal under this key
 * @param {*}       [spec.storage]  'local' (default with a key), 'session', 'cookie', localStorage, a { get, set } store …
 */
export function typedSignal (spec = {}) {
  if (!isPlainObject(spec)) throw new TypeError('[aufbau/signals] typedSignal takes a spec: { type, value }');

  const Type = spec.type === undefined ? inferType(spec) : resolveType(spec.type);
  if (!Type) throw new TypeError(`[aufbau/signals] unknown type ${String(spec.type)}, expected one of ${TYPE_NAMES.join(', ')}, a native constructor or a signal class`);

  const signal = Type === EnumSignal   ? new EnumSignal(spec.value, spec.values)
               : Type === NumberSignal ? new NumberSignal(spec.value, spec)
               :                         new Type(spec.value);
  if (spec.key) persistSignal(signal, spec.storage ?? 'local', spec.key);
  return signal;
}

export default typedSignal;
