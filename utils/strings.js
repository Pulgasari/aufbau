// @aufbau/utils/strings.js

export let
capitalize = str => str.charAt(0).toUpperCase() + str.slice(1),
prefixed   = ( value, prefix='--' ) => String(value).startsWith(prefix) ? String(value) : prefix+value,
suffixed   = ( value, suffix='px' ) => String(value).  endsWith(suffix) ? String(value) : value+suffix,
unprefixed = ( value, prefix='--' ) => String(value).startsWith(prefix) ? String(value).slice(   prefix.length) : String(value),
unsuffixed = ( value, suffix='px' ) => String(value).  endsWith(suffix) ? String(value).slice(0,-suffix.length) : String(value),

// string: to / case
toWords        = str => str.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[-_.\s]+/g, ' ').trim().toLowerCase().split(' ').filter(Boolean),
toCamelCase    = str => toWords(str).map( (word, i) => i === 0 ? word : word[0].toUpperCase() + word.slice(1)) .join(''),
toConstantCase = str => toWords(str).join('_').toUpperCase(),
toKebabCase    = str => toWords(str).join('-'),
toPascalCase   = str => toWords(str).map( word => word[0].toUpperCase() + word.slice(1) ).join(''),
toSnakeCase    = str => toWords(str).join('_'),
toTitleCase    = str => toWords(str).map(word => word[0].toUpperCase() + word.slice(1)).join(' '),
toSlug = str => {
  return str.toString().toLowerCase().trim()
    .normalize('NFD') // split accented characters into their base and accent
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(/--+/g, '-'); // replace multiple - with single -
};



// The Chain
class VanillaXStrChain {
  constructor (s) { this._str = s; }
  toString    ()  { return String(this._str); }
  valueOf     ()  { return this._str; }
  
  [Symbol.toPrimitive] (hint) {
    return (hint === 'number') 
      ? Number(this._str)
      : String(this._str);
  }
}
// add all methods to chain
for (let [name, fn] of Object.entries({
  toCamelCase, 
  toConstantCase, 
  toKebabCase, 
  toPascalCase, 
  toSnakeCase,
  replace, 
  replaceAll
})) {
  Object.defineProperty( StrChain.prototype, name, {
    value: function( ...args ){
      this._str = fn( this._str, ...args );
      return this;
    },
    configurable: true,
    writable: true
  });
}
export let str = s => new VanillaXStrChain(s);
