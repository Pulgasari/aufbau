// @aufbau/signals/leaf.js
// one way to read, write, restore and reset a leaf, whether it is a typed signal
// or a deep node. a deep node has no .value: `value` may be one of its own keys.

import { isDeep } from './DeepSignal.js';

const initials = new WeakMap;   // deep node -> its declared value, for reset()

export const
readLeaf  = leaf => isDeep(leaf) ? leaf.$signal.value : leaf.value,
peekLeaf  = leaf => isDeep(leaf) ? leaf.$peek()       : leaf.peek(),
writeLeaf = (leaf, value) => { isDeep(leaf) ? leaf.$replace(value) : leaf.value = value; },

// hydration: a deep node merges, so a key added to the defaults since the value
// was stored keeps its default. a typed signal may write past its own validation
restoreLeaf = (leaf, value) => { isDeep(leaf) ? leaf.$update(value) : leaf.$restore(value); },

rememberLeaf = leaf => { if (isDeep(leaf) && !initials.has(leaf)) initials.set(leaf, structuredClone(leaf.$peek())); return leaf; },
resetLeaf    = leaf => { isDeep(leaf) ? leaf.$replace(structuredClone(initials.get(leaf) ?? {})) : leaf.reset(); };

export { isDeep };
