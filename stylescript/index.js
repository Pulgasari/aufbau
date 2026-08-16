// stylescript/index.js

import { Angle }  from './types/Angle.js';
import { Color }  from './types/Color.js';
import { Length } from './types/Length.js';
import { Time }   from './types/Time.js';

import { ass, createController, stylesheet } from './factory.js';

export * from './cache.js';
export * from './classes/index.js';
export * from './methods/index.js';
export * from './types/index.js';

// back-compat: the default controller also carries the type kit and guards, so
// `ass.Color(...)` / `ass.isColor(...)` keep working next to the new
// aliases/tokens/vars/sheets registries.
const isTypeOf = (value, Type) => {
  if (value == null)         return false;
  if (value instanceof Type) return true;
  const prototype = Object.getPrototypeOf(Type);
  return prototype ? value instanceof prototype : false;
};

Object.assign(ass, {
  Angle, Color, Length, Time,
  isTypeOf,
  isAngle  : (value) => isTypeOf(value, Angle),
  isColor  : (value) => isTypeOf(value, Color),
  isLength : (value) => isTypeOf(value, Length),
  isTime   : (value) => isTypeOf(value, Time),
});

export { ass, createController, stylesheet };
