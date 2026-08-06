// @aufbau/utils/fp/string.js

import {
  ensurePrefix,
  ensureSuffix,
  template as templateOf,
  truncate as truncateOf
} from '../string.js';

// already unary in ../string.js and therefore pipe-ready as they are
export {
  capitalize,
  dedent,
  slugify,
  unquote
} from '../string.js';

export const toWords = (value) => String(value)
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/[\s\-_.]+/g, ' ')
  .trim()
  .toLowerCase()
  .split(' ')
  .filter(Boolean);

// :::::: UNARY TRANSFORMS

export const 
toLowerCase    = value => value.toLowerCase (),
toUpperCase    = value => value.toUpperCase (),
toCamelCase    = value => toWords(value).map((word, index) => index ? upperFirst(word) : word).join(''),    
toConstantCase = value => toWords(value).join('_').toUpperCase(),
toKebabCase    = value => toWords(value).join('-'),
toPascalCase   = value => toWords(value).map(upperFirst).join(''),
toSnakeCase    = value => toWords(value).join('_'),
toTitleCase    = value => toWords(value).map(upperFirst).join(' '),
trim           = value => value.trim      (),
trimEnd        = value => value.trimEnd   (),
trimStart      = value => value.trimStart ();

// :::::: CONFIGURED TRANSFORMS

export const
padEnd     = (length, filler = ' ') => (value) => value.padEnd(length, filler),
padStart   = (length, filler = ' ') => (value) => value.padStart(length, filler),
prefix     = (text)                 => (value) => ensurePrefix(value, text),
replace    = (search, replacement)  => (value) => value.replace(search, replacement),
replaceAll = (search, replacement)  => (value) => value.replaceAll(search, replacement),    
split      = (separator)            => (value) => value.split(separator),
suffix     = (text)                 => (value) => ensureSuffix(value, text),
template   = (values)               => (value) => templateOf(value, values),
truncate   = (length, ending)       => (value) => truncateOf(value, length, ending);

// :::::: QUERY

export const 
endsWith   = search => value => value.endsWith   (search),
startsWith = search => value => value.startsWith (search);
