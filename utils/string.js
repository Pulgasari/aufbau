// @aufbau/utils/string.js

const upperFirst = (word) => word.charAt(0).toUpperCase() + word.slice(1);

export const toWords = (value) => String(value)
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/[\s\-_.]+/g, ' ')
  .trim()
  .toLowerCase()
  .split(' ')
  .filter(Boolean);

export const toCamelCase    = (value) => toWords(value).map((word, index) => index ? upperFirst(word) : word).join('');
export const toConstantCase = (value) => toWords(value).join('_').toUpperCase();
export const toKebabCase    = (value) => toWords(value).join('-');
export const toPascalCase   = (value) => toWords(value).map(upperFirst).join('');
export const toSnakeCase    = (value) => toWords(value).join('_');
export const toTitleCase    = (value) => toWords(value).map(upperFirst).join(' ');
