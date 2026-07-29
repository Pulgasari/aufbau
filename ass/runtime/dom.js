// /ass/runtime/dom.js
// proxy-based element.ass API extension

import { resolveValue, normalizeProp } from './resolver.js';

export function createAssProxy (element, options = {}) {
  return new Proxy( element, {
    get (target, prop) {
      if (typeof prop !== 'string') return Reflect.get(target, prop);
      const norm = normalizeProp( prop );
      return target.style[norm];
    },
    set (target, prop, val) {
      if ( typeof prop !== 'string' ) return Reflect.set(target, prop, val);
      const norm     = normalizeProp(prop);
      const resolved = resolveValue(prop, val, options.tokens);
      target.style[norm] = resolved;
      return true;
    }
  } );
}

export function attachAssToDOM (options = {}) {
  if (typeof Element === 'undefined' || Element.prototype.ass) return;

  Object.defineProperty( Element.prototype, 'ass', {
    get () {
      if (!this._assProxy) this._assProxy = createAssProxy(this, options);
      return this._assProxy;
    },
    configurable: true
  } );
}



export function normalizeUnit (unit) {
  if (typeof unit === 'function') return unit;
  if (typeof unit === 'string')   return CSS[unit];
  return null;
}

const ass = {};
get = function (key, withUnit = true) {

};
set = function (key, value, unit) {
  if (!key || value === undefined) return;

  if (unit) {
    key  = normalizeProp(key);
    unit = normalizeUnit(unit);
    this.attributeStyleMap.set(key, CSS[unit](value);
  }

  if (!unit)
  
}


// Anstatt
element.style.width = "100px";
// schreibt man
element.attributeStyleMap.set("width", CSS.px(100));


