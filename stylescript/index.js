// stylescript/core.js

import { Angle }  from './types/Angle.js';
import { Color }  from './types/Color.js';
import { Length } from './types/Length.js';
import { Time }   from './types/Time.js';

import * as methods from './methods/index.js';

export * from './methods/index.js';


export const ass = {
  Angle,
  Color,
  Length,
  Time,
  
  ...methods,

  // Universal type checking engine
  isTypeOf (value, Type) {
    if (value == null)         return false;
    if (value instanceof Type) return true;
    
    // Handle factory functions with prototype inheritance
    const prototype = Object.getPrototypeOf(Type);
    return prototype ? value instanceof prototype : false;
  },

  isAngle  (value) { return this.isTypeOf (value, Angle);  },
  isColor  (value) { return this.isTypeOf (value, Color);  },
  isLength (value) { return this.isTypeOf (value, Length); },
  isTime   (value) { return this.isTypeOf (value, Time);   },
};
