// utils.js

export const
  
arrayfied = sth => Array.isArray(sth) ? sth : [sth],

isClient = () => window !== 'undefined',

isFn            = sth => typeof sth === 'function',
isNumber        = sth => typeof sth === 'number',
isNumericString = sth => typeof sth === 'string' && /^-?\d+(?:\.\d+)?$/.test(sth.trim()),  
isNumeric       = sth => isNumber(sth) || isNumericString(sth),
isString        = sth => typeof sth === 'string';

