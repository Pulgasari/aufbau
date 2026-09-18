// @aufbau/signals/BaseSignal.js
// the floor under every signal type: what the persistence layer needs to hydrate one,
// and the conveniences all of them share. not a type to reach for itself — take
// ScalarSignal when the value has no shape worth enforcing.

// :::::: IMPORT

import { Signal, effect } from './shared.js';

// :::::: MAIN

class BaseSignal extends Signal {

  $ready = null;

  // hydration is authoritative. a type whose writes validate overrides this to let a
  // stored value past its own rules (see EnumSignal); everything else just writes.
  $restore (next) { this.value = next; }

  // how this signal reads as text — what toNode() renders. a type whose value has no
  // useful String() form overrides it.
  toText () {
    const value = this.value;
    return value == null ? '' : String(value);
  }

  // a live Text node that follows the signal. nothing can tell when a detached node
  // is collected, so the effect is handed back on the node as $dispose(): call it
  // when the node goes away for good, or it keeps the signal subscribed.
  toNode () {
    if (typeof document === 'undefined') throw new Error('[aufbau/signals] toNode() needs a document');

    const node = document.createTextNode('');
    node.$dispose = effect(() => { node.data = this.toText(); });
    return node;
  }

}

// a signal type is callable without `new`, so BoolSignal(false) and new BoolSignal(false)
// are the same thing. instanceof keeps working: the proxy forwards getPrototypeOf.
const callable = Type => new Proxy(Type, { apply: (target, _self, args) => new target(...args) });

// :::::: EXPORT

export { BaseSignal, callable };
export default BaseSignal;
