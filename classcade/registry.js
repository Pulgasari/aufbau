// registry.js

class Registry {
  macros   : new Map;
  methods  : new Map;
  rules    : new Map;
  themes   : new Map;
  variants : new Map;

  // to register
  rule    (obj) { this.rules   .set(obj.id, obj); }
  method  (obj) { this.methods .set(obj.id, obj); }
  variant (obj) { this.variants.set(obj.id, obj); }
};

export default Registry;
