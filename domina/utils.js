// utils.js

export { isArray, isElementish, isFn, isFragment, isNullish, isObject, isString }
from 'https://pulgasari.github.io/aufbau/utils/is.js';

export const
isDate   = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!isNaN(Date.parse(v)) && isNaN(Number(v))),
isEDO    = v => isObject(v) && (v.tag || v.tagName),
isEmpty  = v => v === '' || v === null || v === undefined,
isHTML   = v => isString(v) && v.trim().startsWith('<'),
isIdLike = v => v.charCodeAt(0) === 35 && v.indexOf(' ') === -1 && v.indexOf('.') === -1,
isDings  = el => el.type === 'checkbox' || el.type === 'radio',
isMulti  = el => el.tagName === 'SELECT' && el.multiple,
isURL    = v => isString(v) && v.includes('://');
