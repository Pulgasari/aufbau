// stylescript/types/base.js

// minimal opaque css value. anything that ends up in a declaration serializes
// through toString / Symbol.toPrimitive, so a typed value drops straight into a
// template string or a style object. this is the real base — no arithmetic here.
export class CssValue {
  constructor (raw) {
    this.raw = raw;
  }

  toString () {
    return String(this.raw);
  }

  [Symbol.toPrimitive] () {
    return this.toString();
  }
}

// a css math expression: calc/clamp/min/max, and the fallback for mixed-unit
// arithmetic. opaque — it only serializes, it carries no amount/unit for further math.
export class CalcValue extends CssValue {}

// factory wrapper so both Color(...) and new Color(...) work, and so
// isTypeOf(value, factory) resolves through the factory's prototype.
export function createFactory (TypeClass, staticMethods = {}) {
  const factory = function (...args) {
    return new TypeClass(...args);
  };

  Object.setPrototypeOf (factory, TypeClass);
  Object.assign         (factory, staticMethods);
  return factory;
}
