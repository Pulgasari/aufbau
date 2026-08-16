// classes/TraitStore.js

import { CanonicalMap } from './vendors.js';

// Trait Registry powered by CanonicalMap
export class TraitStore {
  constructor() {
    this.traits = new CanonicalMap({}, ['kebab', 'camel', 'snake']);
  }

  // Register a new trait definition
  set (name, rules) {
    this.traits.set(name, rules);
    return this;
  }

  get (name) {
    return this.traits.get(name);
  }
}
