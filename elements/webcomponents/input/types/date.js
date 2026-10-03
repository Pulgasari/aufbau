// a date: '2026-10-03'. on the axis as epoch milliseconds

import text    from './text.js';
import { DAY } from './time.js';

export const parseStamp = raw => {
  if (raw == null || raw === '') return null;
  const date = raw instanceof Date ? raw : new Date(String(raw));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

export default {
  ...text,
  icon   : 'lucide:calendar',
  input  : 'date',
  parse  : parseStamp,
  format : value => value == null ? '' : new Date(value).toISOString().slice(0, 10),

  // no bounds of its own: a date slider needs min and max
  axis : {
    bounds     : null,
    fromNumber : number => number,
    step       : DAY,
    toNumber   : value => value ?? 0,
  },
};
