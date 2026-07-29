// registry.js

class Registry {
  macros   = new Map;
  methods  = new Map;
  rules    = new Map;
  themes   = new Map;
  variants = new Map;

  // to add
  addMacro   (obj) { this.macros  .set(obj.id, obj); return this; }
  addMethod  (obj) { this.methods .set(obj.id, obj); return this; }
  addRule    (obj) { this.rules   .set(obj.id, obj); return this; }
  addVariant (obj) { this.variants.set(obj.id, obj); return this; }

  // to get
  getMacro   (id) { return this.macros  .get(id); }
  getMethod  (id) { return this.methods .get(id); }
  getRule    (id) { return this.rules   .get(id); }
  getVariant (id) { return this.variants.get(id); }
};

export default Registry;
