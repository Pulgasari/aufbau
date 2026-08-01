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
deepMerge = ( target, source ) => {
  if (!isPlainObject(source)) return source;
  Object.keys(source).forEach( key => {
    isEvery(isPlainObject, target[key], source[key]) //fixme
    ? deepMerge( target[key], source[key] )
    : target[key] = source[key];
  });
  return target;
},

// ::: events
offEvent  = (...args) => _event(...args, 0),
onEvent   = (...args) => _event(...args, 1),
onceEvent = (...args) => _event(...args, 2),
customEvent = ( target, name, value ) => {
  let element = _el(target);
  let event   = new CustomEvent( name, { detail: value } );
  event.value = value;
  element.dispatchEvent(event);
},
onGlobalEvent = ( selector, type, callback, options, parent=document ) => {
  let listener = e => e.target.matches(selector) && callback(e);
  parent.addEventListener( type, listener, options );
},




////////// NON-EXPORT HELPERS FOR CONSTRUCTION //////////

function _event ( targets, types, listener, options, mode=1 ) {
  let method  = (mode === 0 ? 'remove' : 'add') + 'EventListener';
  options = mode === 2 ? { ...options, once: true } : options;
  arrayfied(targets).forEach( 
    target => arrayfied(types).forEach( 
      type => _el(target)?.[method](type, listener, options) 
    )
  );
  if (mode === 1) return () => offEvent( targets, types, listener);
};

