// @aufbau/elements/core/valueTypes.js
// one table per value type. `type` means the same thing on every control:
// what kind of value it holds, never how it looks.

// :::::: COLOR :::::::::::::::::::::::::::::::::::::::::::::::::

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

const toHex = (value) => {
  const match = String(value ?? '').trim().match(HEX);
  if (!match) return null;
  const digits = match[1];
  return '#' + (digits.length === 3 ? [...digits].map(c => c + c).join('') : digits).toLowerCase();
};

const channels = (hex) => {
  const parsed = toHex(hex) ?? '#000000';
  return [1, 3, 5].map(i => parseInt(parsed.slice(i, i + 2), 16));
};

const hslOf = (hex) => {
  const [red, green, blue] = channels(hex).map(c => c / 255);
  const max   = Math.max(red, green, blue);
  const min   = Math.min(red, green, blue);
  const light = (max + min) / 2;
  const delta = max - min;

  if (!delta) return [0, 0, light];

  const hue = max === red   ? ((green - blue) / delta) % 6
            : max === green ? (blue - red) / delta + 2
            :                 (red - green) / delta + 4;

  return [(hue * 60 + 360) % 360, delta / (1 - Math.abs(2 * light - 1)), light];
};

const fromHsl = (hue, saturation, light) => {
  const chroma = (1 - Math.abs(2 * light - 1)) * saturation;
  const sector = (((hue % 360) + 360) % 360) / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const offset = light - chroma / 2;

  const [red, green, blue] =
      sector < 1 ? [chroma, second, 0]
    : sector < 2 ? [second, chroma, 0]
    : sector < 3 ? [0, chroma, second]
    : sector < 4 ? [0, second, chroma]
    : sector < 5 ? [second, 0, chroma]
    :              [chroma, 0, second];

  return '#' + [red, green, blue]
    .map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0'))
    .join('');
};

// hue in degrees, the axis a color slider actually moves along
const hueOf  = (hex) => hslOf(hex)[0];

/**
 * moving the hue must not flatten the color. saturation and lightness come from
 * `previous`, so #3355ff stays a muted blue instead of snapping to #002aff.
 */
const fromHue = (hue, previous) => {
  const [, saturation, light] = previous ? hslOf(previous) : [0, 1, 0.5];
  return fromHsl(hue, saturation || 1, light || 0.5);
};

// :::::: TIME ::::::::::::::::::::::::::::::::::::::::::::::::::

const MINUTE = 60_000;
const DAY    = 86_400_000;

const pad = (value, length = 2) => String(value).padStart(length, '0');

// a bare time is stored as milliseconds since midnight, so it stays timezone free
const parseClock = (value) => {
  const [hours = 0, minutes = 0, seconds = 0] = String(value ?? '').split(':').map(Number);
  const total = (hours * 60 + minutes) * MINUTE + seconds * 1000;
  return Number.isFinite(total) ? total : null;
};

const formatClock = (ms) => {
  const clamped = ((ms % DAY) + DAY) % DAY;
  return `${pad(Math.floor(clamped / 3_600_000))}:${pad(Math.floor(clamped / MINUTE) % 60)}`;
};

// <input type="datetime-local"> speaks local wall clock, not utc
const parseStamp = (value) => {
  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatDate  = (ms) => new Date(ms).toISOString().slice(0, 10);

const formatStamp = (ms) => {
  const date = new Date(ms);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
       + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// :::::: TABLE :::::::::::::::::::::::::::::::::::::::::::::::::

/*
  input      native <input type> to fall back on
  icon       default leading icon, overridable per element
  parse      raw attribute string -> value
  format     value -> attribute/field string
  toNumber   value -> position on a numeric axis (sliders)
  fromNumber position on a numeric axis -> value
  step       sensible default step for that axis
  bounds     default [min, max] for the axis, null when it must be given
*/

const identity = (value) => value;
const text = {
  input      : 'text',
  icon       : null,
  parse      : (raw) => raw == null ? '' : String(raw),
  format     : (value) => value == null ? '' : String(value),
  toNumber   : (value) => Number(value) || 0,
  fromNumber : (value) => String(value),
  step       : 1,
  bounds     : [0, 100],
};

export const VALUE_TYPES = {

  color : {
    ...text,
    input      : 'color',
    icon       : 'lucide:palette',
    parse      : (raw) => toHex(raw) ?? '#000000',
    format     : (value) => toHex(value) ?? '#000000',
    toNumber   : hueOf,
    fromNumber : fromHue,
    step       : 1,
    bounds     : [0, 360],
  },

  date : {
    ...text,
    input      : 'date',
    icon       : 'lucide:calendar',
    parse      : parseStamp,
    format     : (value) => value == null ? '' : formatDate(value),
    toNumber   : identity,
    fromNumber : identity,
    step       : DAY,
    bounds     : null,
  },

  datetime : {
    ...text,
    input      : 'datetime-local',
    icon       : 'lucide:calendar-clock',
    parse      : parseStamp,
    format     : (value) => value == null ? '' : formatStamp(value),
    toNumber   : identity,
    fromNumber : identity,
    step       : MINUTE,
    bounds     : null,
  },

  email : {
    ...text,
    input : 'email',
    icon  : 'lucide:mail',
  },

  number : {
    ...text,
    input      : 'number',
    icon       : null,
    parse      : (raw) => { const value = parseFloat(raw); return Number.isNaN(value) ? null : value; },
    format     : (value) => value == null ? '' : String(value),
    toNumber   : (value) => value ?? 0,
    fromNumber : identity,
  },

  password : {
    ...text,
    input : 'password',
    icon  : 'lucide:lock',
  },

  // named `phone` on purpose, mapped onto the native `tel` input
  phone : {
    ...text,
    input : 'tel',
    icon  : 'lucide:phone',
  },

  text : { ...text },

  time : {
    ...text,
    input      : 'time',
    icon       : 'lucide:clock',
    parse      : parseClock,
    format     : (value) => value == null ? '' : formatClock(value),
    toNumber   : identity,
    fromNumber : identity,
    step       : MINUTE,
    bounds     : [0, DAY - MINUTE],
  },

  url : {
    ...text,
    input : 'url',
    icon  : 'lucide:link',
  },
};

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

/** every value type, for `values:` in an attribute schema */
export const TYPE_NAMES = Object.keys(VALUE_TYPES);

/** the subset that maps onto a numeric axis, so a slider can carry it */
export const AXIS_TYPES = ['color', 'date', 'datetime', 'number', 'time'];

export const valueType = (name) => VALUE_TYPES[name] ?? VALUE_TYPES.text;

export { DAY, MINUTE, fromHsl, fromHue, hslOf, hueOf, toHex };
