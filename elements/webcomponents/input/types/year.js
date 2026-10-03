// a calendar year, a plain integer on its own axis

import text from './text.js';

export default {
  ...text,
  icon   : 'lucide:calendar',
  input  : 'number',
  look   : 'stepper',
  parse  : raw   => { const value = parseInt(raw, 10); return Number.isNaN(value) ? null : value; },
  format : value => value == null ? '' : String(value),

  axis : {
    bounds     : [1900, 2100],
    fromNumber : number => Math.round(number),
    step       : 1,
    toNumber   : value => value ?? 0,
  },
};
