// url.js

import { isArray, isNullish, isString, isUrl } from './is.js';
import { arrayfied, toSlug } from './util.js';

// helper
let _slug = v => arrayfied(v).flatMap( x => isArray(x) ? x.map(toSlug) : toSlug(x) );

class Url {
  constructor (input) {
    this.instance = new URL( input?.toString() ?? window.location.href, window.location.origin );
    this._initHandlers();
  }

  _initHandlers(){
    //
    let T = this, 
        I = T.instance, 
       PN = I.pathname,
       SP = I.searchParams,
        P = T.path,
        S = P.segments,
        Q = T.query;
    // PATH
    this.path = {
      get segments()    { return PN.split('/').filter(Boolean); },
      set segments(arr) { PN = `/${arr.join('/')}`; },
      append   : (...a) => { S = [ ...S, ..._slug(a) ]; return P; },
      prepend  : (...a) => { S = [ ..._slug(a), ...S ]; return P; },
      add      : (...a) => (a.forEach( v => !P.has(v) && P.append(v) ), P),
      remove   : (...a) => { S = S.filter( s => !a.map(toSlug).includes(s) ); return P; },
      has      : v  => S.includes(toSlug(v)),
      toArray  : () => S,
      toString : () => PN,
    };
    // QUERY (proxyfied URL.searchParams)
    this.query = new Proxy({
      get      : k     => SP.get(k),
      set      : (k,v) => { isNullish(v) ? SP.delete(k) : SP.set(k,v); return Q; },
      clear    : ()    => { I.search = ''; return Q; },
      delete   : k     => (SP.delete(k), Q),
      toObject : ()    => Object.fromEntries(SP),
      toString : ()    => I.search,
    },{
      get : (t,k)   => (k in t) ? t[k] : t.get(k),
      set : (t,k,v) => (t.set(k,v), true)
    });
  }

  get full() { return this.instance.href; }
  clone()    { return new Url(this.full); }
  toString() { return this.full; }
};

// EXPORT
export let url = input => new Url(input);
