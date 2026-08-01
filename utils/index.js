// @aufbau/utils


export function slugify (text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}




export const 
  
// timing
debounce  = ( fn, delay=100 ) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }
},
sleep = (duration=1000) => new Promise( resolve => setTimeout(resolve, duration) ),     

// array
arrayfied = value => isArray(value) ? value : [value],

// ::: object

/ object
deepMerge = ( target, source ) => {
  if (!isPlainObject(source)) return source;
  Object.keys(source).forEach( key => {
    isEvery(isPlainObject, target[key], source[key]) //fixme
    ? deepMerge( target[key], source[key] )
    : target[key] = source[key];
  });
  return target;
},
