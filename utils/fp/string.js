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
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
  toTitleCase,
  unquote
} from '../string.js';

// :::::: UNARY TRANSFORMS

export const 
toLower   = value => value.toLowerCase (),
toUpper   = value => value.toUpperCase (),
trim      = value => value.trim        (),
trimEnd   = value => value.trimEnd     (),
trimStart = value => value.trimStart   ();

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
