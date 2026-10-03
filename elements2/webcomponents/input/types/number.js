import text from './text.js';

export default {
  ...text,
  input  : 'number',
  parse  : raw   => { const value = parseFloat(raw); return Number.isNaN(value) ? null : value; },
  format : value => value == null ? '' : String(value),

  axis : {
    bounds     : [0, 100],
    fromNumber : number => number,
    step       : 1,
    toNumber   : value => value ?? 0,
  },
};
