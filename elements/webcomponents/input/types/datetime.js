import text           from './text.js';
import { parseStamp } from './date.js';
import { MINUTE }     from './time.js';

const pad = value => String(value).padStart(2, '0');

const formatStamp = ms => {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default {
  ...text,
  icon   : 'lucide:calendar-clock',
  input  : 'datetime-local',
  parse  : parseStamp,
  format : value => value == null ? '' : formatStamp(value),

  axis : {
    bounds     : null,
    fromNumber : number => number,
    step       : MINUTE,
    toNumber   : value => value ?? 0,
  },
};
