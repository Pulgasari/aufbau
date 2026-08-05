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


export const capitalize = (value) => String(value).charAt(0).toUpperCase() + String(value).slice(1);

export const dedent = (value) => {
  const lines   = String(value).replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const filled  = lines.filter(line => line.trim());
  if (!filled.length) return '';
  const indent = Math.min(...filled.map(line => line.match(/^ */)[0].length));
  return lines.map(line => line.slice(indent)).join('\n');
};

export const ensurePrefix = (value, prefix) =>
  String(value).startsWith(prefix) ? String(value) : prefix + value;

export const ensureSuffix = (value, suffix) =>
  String(value).endsWith(suffix) ? String(value) : value + suffix;

export const slugify = (value) => String(value)
  .replace(/ß/g, 'ss')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

export const template = (value, values = {}) =>
  String(value).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

export const truncate = (value, length, suffix = '…') =>
  String(value).length <= length
    ? String(value)
    : String(value).slice(0, Math.max(0, length - suffix.length)) + suffix;

export const unquote = (value) => String(value).replace(/^(['"`])([\s\S]*)\1$/, '$2');
