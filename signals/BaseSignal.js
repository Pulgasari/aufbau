// @aufbau/signals/BaseSignal.js
// the base class — not a type to reach for itself 

// :::::: IMPORT

import { Signal, effect } from './shared.js';

// :::::: MAIN

class BaseSignal extends Signal {

  $ready = null;

  $restore (next) { this.value = next; }

  toText () {
    const value = this.value;
    return value == null ? '' : String(value);
  }

  toNode () {
    if (typeof document === 'undefined') throw new Error('[aufbau/signals] toNode() needs a document');

    const node = document.createTextNode('');
    node.$dispose = effect(() => { node.data = this.toText(); });
    return node;
  }

}

// ???
// a signal type is callable without `new`, 
// so BoolSignal(false) and new BoolSignal(false) are the same thing.
// instanceof keeps working: the proxy forwards getPrototypeOf.
const callable = Type => new Proxy(Type, { apply: (target, _self, args) => new target(...args) });

// :::::: EXPORT

export { BaseSignal, callable };
export default BaseSignal;
