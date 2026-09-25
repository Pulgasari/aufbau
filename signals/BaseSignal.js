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

  // a live text node. nothing can tell when a detached node is collected, so the
  // effect is handed back as node.$dispose(): call it when the node goes for good
  asNode () {
    if (typeof document === 'undefined') throw new Error('[aufbau/signals] asNode() needs a document');

    const node = document.createTextNode('');
    node.$dispose = effect(() => { node.data = this.toText(); });
    return node;
  }

  // an element whose text follows the signal, disposed the same way
  asElement (tag = 'span', attributes = {}) {
    if (typeof document === 'undefined') throw new Error('[aufbau/signals] asElement() needs a document');

    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    element.$dispose = effect(() => { element.textContent = this.toText(); });
    return element;
  }

  toElement (...args) { return this.asElement(...args); }
  toNode    ()        { return this.asNode(); }

}

// a signal type is callable without `new`,
// so BoolSignal(false) and new BoolSignal(false) are the same thing.
// instanceof keeps working: the proxy forwards getPrototypeOf.
const callable = Type => new Proxy(Type, { apply: (target, _self, args) => new target(...args) });

// :::::: EXPORT

export { BaseSignal, callable };
export default BaseSignal;
