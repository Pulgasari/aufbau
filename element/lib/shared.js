// shared.js

//export { isFn, isPlainObject } from '@pulgasari/is';

export const // inlined from: @pulgasari/is
isInstanceOf = constructor => v => v instanceof constructor,
isMatchOf    = regexp      => v => typeof v === 'string' && regexp.test(v),
isTypeOf     = type        => v => typeof v === type;

export const // inlined from: @pulgasari/is
isArray  = Array.isArray,
isFn     = isTypeOf('function'),
isPlainObject = v => {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === null || proto === Object.prototype;
};

const // inlined from: @pulgasari/str
upperFirst = (word) => word.charAt(0).toUpperCase() + word.slice(1),
toWords = (value) => String(value ?? '')
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/[\s\-_.]+/g, ' ')
  .trim()
  .toLowerCase()
  .split(' ')
  .filter(Boolean);

export const // inlined from: @pulgasari/str
toCamelCase = value => toWords(value).map((word, index) => index ? upperFirst(word) : word).join(''),    
toKebabCase = value => toWords(value).join('-');
