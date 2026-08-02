// @aufbau/utils

//import { isArray, isEvery, isFn, isNullish, isObject, isPlainObject } from './is.js';
//import { _el } from './dom.js';



export function slugify (text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/*
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
filterList = ( input, config ) => {
  
  // Define Input
  let list = isObject(input) ? Object.keys(input) : Array.from( input || [] );
  
  // Predicate
  let getPredicates = ( conf, negate=false ) => {
    let preds = [];
    let add   = (key, fn) => !isNullish(conf[key]) && preds.push( negate ? (item => !fn(item)) : fn );
    
    // regular filters
    add( 'includes'   , item => item.includes(conf.includes));
    add( 'endsWith'   , item => item.endsWith(conf.endsWith));
    add( 'startsWith' , item => item.startsWith(conf.startsWith));
    add( 'length'     , item => item.length === conf.length);
    add( 'maxLength'  , item => item.length <= conf.maxLength);
    add( 'minLength'  , item => item.length >= conf.minLength);
    add( 'regex'      , item => conf.regex.test(item));
    
    // custom filters
    if (isArray(conf.filter)) conf.filter.forEach( f => preds.push(negate ? (item => !f(item)) : f ));
    
    // not (negation)
    if (conf.not) preds.push( ...getPredicates(conf.not, !negate) );
    
    //
    return preds;
  };
  
  // Cache Predicates
  let cachedPredicates = getPredicates(config);
  
  // Process
  list = list.filter( 
    item => cachedPredicates.every( p => p(item) ) 
  );
  
  // Post-Process
  if (config.toLowerCase)     list = list.map( x => x.toLowerCase() );
  if (config.toUpperCase)     list = list.map( x => x.toUpperCase() );
  if (isArray(config.output)) config.output.forEach( f => list = list.map(f) );
  if (config.sort)            list = isFn(config.sort) ? list.sort(config.sort) : list.sort();
  
  // Final Output
  return list;
},

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
};




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
*/
