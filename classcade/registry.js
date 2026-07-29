// registry.js

class Registry {
  macros   : new Map;
  methods  : new Map;
  rules    : new Map;
  themes   : new Map;
  variants : new Map;

  // to register
  method  (obj) { this.methods .set(obj.id, obj); }
  rule    (obj) { this.rules   .set(obj.id, obj); }
  variant (obj) { this.variants.set(obj.id, obj); }
};

export default Registry;
