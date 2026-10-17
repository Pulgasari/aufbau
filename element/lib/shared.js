// shared.js

export { isFn, isPlainObject } from '@pulgasari/is';

export const // inlined from: @pulgasari/is
isInstanceOf = constructor => v => v instanceof constructor,
isMatchOf    = regexp      => v => typeof v === 'string' && regexp.test(v),
isTypeOf     = type        => v => typeof v === type;


export const // inlined from: @pulgasari/is
isFn        = isTypeOf('function'),
isPlainObject = v => {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === null || proto === Object.prototype;
},
