// stylescript/types/base.js

// Base class for all StyleScript type instances
export class CssValue {
  [Symbol.toPrimitive](hint) {
    return this.toString();
  }
}

/**
 * Factory wrapper maker to allow both Color(...) and new Color(...) syntax
 */
function createFactory (TypeClass, staticMethods = {}) {
  const factory = function (...args) {
    return new TypeClass(...args);
  };

  Object.setPrototypeOf (factory, TypeClass);
  Object.assign         (factory, staticMethods);
  return factory;
}
