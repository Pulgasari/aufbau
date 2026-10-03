import text from './text.js';

const PATTERN = /^\s*(-?\d*\.?\d+)\s*([a-z]*)\s*$/i;

const amountOf = raw => { const match = PATTERN.exec(String(raw ?? '')); return match ? Number(match[1]) : null; };
const unitOf   = raw => { const match = PATTERN.exec(String(raw ?? '')); return match?.[2] || 's'; };

export default {
  ...text,
  icon   : 'lucide:timer',
  parse  : amountOf,
  format : value => value == null ? '' : String(value),

  axis : {
    bounds     : [0, 10],
    fromNumber : (number, previous) => `${number}${unitOf(previous)}`,
    step       : 0.1,
    toNumber   : value => value ?? 0,
  },
};
