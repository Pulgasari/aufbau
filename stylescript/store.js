// stylescript/store.js
import CanonicalMap from './CanonicalMap.js';

// Trait Registry powered by CanonicalMap
export class TraitStore {
  constructor() {
    // Canonical format is kebab-case, accepts camel, snake, and constant cases
    this.traits = new CanonicalMap({}, ['kebab', 'camel', 'snake']);
  }

  // Register a new trait definition
  register(name, rules) {
    this.traits.set(name, rules);
    return this;
  }

  // Retrieve trait regardless of casing ('flow-x', 'flowX', 'FLOW_X')
  get(name) {
    return this.traits.get(name);
  }
}

// Usage Example
const traits = new TraitStore();

// Registered via kebab-case
traits.register('flow-x', {
  display: 'flex',
  flexDirection: 'row',
});

// Retrieved seamlessly via camelCase!
const flowX = traits.get('flowX');
