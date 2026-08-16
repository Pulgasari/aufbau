// stylescript/types/Num.js

import { CalcValue, CssValue, createFactory } from './base.js';

const NUMERIC = /^\s*(-?\d*\.?\d+)(.*)$/;

/**
 * Generic numeric css value: an amount plus a unit. Same-unit arithmetic evaluates
 * directly (10px + 20px -> 30px); mixed units fall back to a calc() expression.
 * Length, Angle and Time specialize it with per-unit factories.
 */
export class Num extends CssValue {
  constructor (value, unit = 'px') {
    super();
    if (typeof value === 'number') {
      this.amount = value;
      this.unit   = unit;
    } else {
      const match = String(value).match(NUMERIC);
      this.amount = match ? parseFloat(match[1]) : NaN;
      this.unit   = match && match[2].trim() ? match[2].trim() : unit;
    }
  }

  add (other) { return this._binaryOp(other, '+'); }
  sub (other) { return this._binaryOp(other, '-'); }

  mul (factor) {
    return typeof factor === 'number'
      ? new this.constructor(this.amount * factor, this.unit)
      : new CalcValue(`calc(${this} * ${factor})`);
  }

  div (divisor) {
    return typeof divisor === 'number' && divisor !== 0
      ? new this.constructor(this.amount / divisor, this.unit)
      : new CalcValue(`calc(${this} / ${divisor})`);
  }

  scale (factor) { return this.mul(factor); }

  _binaryOp (other, op) {
    const target = other instanceof Num    ? other
                 : typeof other === 'number' ? new Num(other, this.unit)
                 :                             new Num(other, this.unit);

    // same-unit fast path: evaluate in js and keep the concrete type
    if (this.unit === target.unit && Number.isFinite(this.amount) && Number.isFinite(target.amount)) {
      const amount = op === '+' ? this.amount + target.amount : this.amount - target.amount;
      return new this.constructor(amount, this.unit);
    }

    return new CalcValue(`calc(${this} ${op} ${target})`);
  }

  toString () {
    return `${this.amount}${this.unit}`;
  }
}

// callable convenience: num('10px') / num(10, 'rem'), alongside new Num(...).
export const num = createFactory(Num);
