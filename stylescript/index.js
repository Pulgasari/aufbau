// stylescript/core.js
import { Color }  from './types/color.js';
import { Length } from './types/length.js';

export const ass = {
  Color,
  Length,

  // Universal type checking engine
  isTypeOf (value, Type) {
    if (value == null)         return false;
    if (value instanceof Type) return true;
    
    // Handle factory functions with prototype inheritance
    const prototype = Object.getPrototypeOf(Type);
    return prototype ? value instanceof prototype : false;
  },

  isColor  (value) { return this.isTypeOf (value, Color);  },
  isLength (value) { return this.isTypeOf (value, Length); }
};
