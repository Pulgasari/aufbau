import text from './text.js';

export const MINUTE = 60_000;
export const DAY    = 86_400_000;

const pad = value => String(value).padStart(2, '0');

const parseClock = raw => {
  if (raw == null || raw === '') return null;
  const [hours = 0, minutes = 0, seconds = 0] = String(raw).split(':').map(Number);
  const total = (hours * 60 + minutes) * MINUTE + seconds * 1000;
  return Number.isFinite(total) ? total : null;
};

const formatClock = ms => {
  const clamped = ((ms % DAY) + DAY) % DAY;
  return `${pad(Math.floor(clamped / 3_600_000))}:${pad(Math.floor(clamped / MINUTE) % 60)}`;
};

export default {
  ...text,
  icon   : 'lucide:clock',
  input  : 'time',
  parse  : parseClock,
  format : value => value == null ? '' : formatClock(value),

  axis : {
    bounds     : [0, DAY - MINUTE],
    fromNumber : number => number,
    step       : MINUTE,
    toNumber   : value => value ?? 0,
  },
};
