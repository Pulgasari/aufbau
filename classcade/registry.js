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
  method  (obj) { this.methods .set(obj.id, obj); }
  rule    (obj) { this.rules   .set(obj.id, obj); }
  variant (obj) { this.variants.set(obj.id, obj); }
};

export default Registry;
