// registry.js

class Registry {
  constructor() {
    this.macros   = new Map;
    this.methods  = new Map;
    this.rules    = new Map;
    this.themes   = new Map;
    this.variants = new Map;
  }

  // to register
  addMacro   (obj) { this.macro   .set(obj.id, obj); }
  addMethod  (obj) { this.methods .set(obj.id, obj); }
  addRule    (obj) { this.rules   .set(obj.id, obj); }
  addVariant (obj) { this.variants.set(obj.id, obj); }

  // getters
  getMacro   (id) { return this.macros  .get(id); }
  getMethod  (id) { return this.methods .get(id); }
  getRule    (id) { return this.rules   .get(id); }
  getVariant (id) { return this.variants.get(id); }
};

export default Registry;
