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


// stylescript/types/base.js

export class CssValue {
  constructor(value) {
    this.raw = value;
  }

  // 1. Addition (Smart unit evaluation or calc fallback)
  add(other) {
    return this._binaryOp(other, '+');
  }

  // 2. Subtraction
  sub(other) {
    return this._binaryOp(other, '-');
  }

  // 3. Scalar Multiplication
  mul(factor) {
    if (typeof factor === 'number' && this.amount !== undefined) {
      return new this.constructor(this.amount * factor, this.unit);
    }
    return new CalcInstance(`(${this} *${factor})`);
  }

  // 4. Scalar Division
  div(divisor) {
    if (typeof divisor === 'number' && this.amount !== undefined && divisor !== 0) {
      return new this.constructor(this.amount / divisor, this.unit);
    }
    return new CalcInstance(`(${this} /${divisor})`);
  }

  _binaryOp(other, op) {
    const target = typeof other === 'number' ? new this.constructor(other, this.unit || 'px') : other;

    // Same unit optimization (e.g. 10px + 20px = 30px)
    if (this.unit && target.unit && this.unit === target.unit) {
      const resultAmount = op === '+' ? this.amount + target.amount : this.amount - target.amount;
      return new this.constructor(resultAmount, this.unit);
    }

    // Mixed units or complex expressions -> Fallback to CSS calc()
    return new CalcInstance(`calc(${this} ${op}${target})`);
  }

  [Symbol.toPrimitive]() {
    return this.toString();
  }
}

class CalcInstance extends CssValue {
  toString() {
    return String(this.raw);
  }
}


// stylescript/types/base.js
import { resolveValue } from './resolver.js';

export class CssValue {
  constructor(value) {
    this.raw = value;
  }

  _binaryOp(other, op) {
    // Automatically parse raw string or number inputs into typed instances
    const target = resolveValue(other, this.unit || 'px');

    // Same unit optimization (e.g. 10px + 20px = 30px)
    if (this.unit && target.unit && this.unit === target.unit) {
      const resultAmount = op === '+' ? this.amount + target.amount : this.amount - target.amount;
      return new this.constructor(resultAmount, this.unit);
    }

    // Mixed units or complex expressions -> Fallback to CSS calc()
    return new CssValue(`calc(${this} ${op} ${target})`);
  }

  add(other) { return this._binaryOp(other, '+'); }
  sub(other) { return this._binaryOp(other, '-'); }

  [Symbol.toPrimitive]() {
    return this.toString();
  }
}
