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

const ass = {};
get = function (key, withUnit = true) {

};
set = function (key, value, unit) {
  if (!key || value === undefined) return;
  key  = normalizeProp(key);
  unit = normalizeUnit(unit);

  if (!unit)
  this.attributeStyleMap.set(key, CSS[unit](value);
}


// Anstatt
element.style.width = "100px";
// schreibt man
element.attributeStyleMap.set("width", CSS.px(100));


