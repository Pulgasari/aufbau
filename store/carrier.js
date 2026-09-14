// @aufbau/store/carrier.js
// wires a describe() result onto a reactive signal and hangs the type's methods
// on it. a carrier is the raw reactive cell behind one key; the store proxy reads
// its value on bare access and dispatches verbs to its methods.

import { computed, signal } from './reactive.js';
import { TYPES }            from './types.js';

export function makeCarrier (desc, ctx) {
  const type = TYPES[desc.type];
  if (!type && desc.type !== 'derived') throw new Error(`[@aufbau/store] unknown type: ${desc.type}`);

  // derived: read-only, recomputed from the store; no persistence, no methods
  if (desc.type === 'derived') {
    const c = computed(() => desc.spec.get(ctx.store));
    return { type: 'derived', spec: desc.spec, readonly: true, methods: {}, reads: {}, get: () => c.value, peek: () => c.peek(), set: () => {}, reset: () => {} };
  }

  const initial = type.coerce(desc.init, desc.spec, undefined);
  const sig     = signal(initial);
  const write   = value => { sig.value = type.coerce(value, desc.spec, sig.peek()); };

  const carrier = {
    type    : desc.type,
    spec    : desc.spec,
    init    : initial,
    methods : {},
    reads   : {},
    get     : () => sig.value,
    peek    : () => sig.peek(),
    set     : write,
    reset   : () => write(initial),
  };

  // mutating methods: apply the pure transform to the current value, write back,
  // return the new value
  for (const [name, fn] of Object.entries(type.methods ?? {}))
    carrier.methods[name] = (...args) => { write(fn(sig.peek(), desc.spec, ...args)); return sig.peek(); };

  // non-mutating reads
  for (const [name, fn] of Object.entries(type.reads ?? {}))
    carrier.reads[name] = (...args) => fn(sig.peek(), desc.spec, ...args);

  return carrier;
}
