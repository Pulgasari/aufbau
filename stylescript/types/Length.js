// types/Length.js

import { createFactory } from './base.js';
import { Num }           from './Num.js';

class LengthInstance extends Num {
  constructor (value, unit = 'px') {
    super(value, unit);
  }
}

export const Length = createFactory (LengthInstance, {
  em  : (value) => new LengthInstance (value, 'em'),
  px  : (value) => new LengthInstance (value, 'px'),
  rem : (value) => new LengthInstance (value, 'rem'),
  vh  : (value) => new LengthInstance (value, 'vh'),
  vw  : (value) => new LengthInstance (value, 'vw'),
});

export default Length;
