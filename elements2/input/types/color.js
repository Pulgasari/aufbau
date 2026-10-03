import text from './text.js';

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const toHex = value => {
  const match = String(value ?? '').trim().match(HEX);
  if (!match) return null;
  const digits = match[1];
  return '#' + (digits.length === 3 ? [...digits].map(digit => digit + digit).join('') : digits).toLowerCase();
};

const channels = hex => {
  const parsed = toHex(hex) ?? '#000000';
  return [1, 3, 5].map(index => parseInt(parsed.slice(index, index + 2), 16));
};

export function hslOf (hex) {
  const [red, green, blue] = channels(hex).map(channel => channel / 255);
  const max   = Math.max(red, green, blue);
  const min   = Math.min(red, green, blue);
  const light = (max + min) / 2;
  const delta = max - min;

  if (!delta) return [0, 0, light];

  const hue = max === red   ? ((green - blue) / delta) % 6
            : max === green ? (blue - red) / delta + 2
            :                 (red - green) / delta + 4;

  return [(hue * 60 + 360) % 360, delta / (1 - Math.abs(2 * light - 1)), light];
}

export function fromHsl (hue, saturation, light) {
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

  return '#' + [red, green, blue].map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('');
}

export const hueOf = hex => hslOf(hex)[0];

export const fromHue = (hue, previous) => {
  const [, saturation, light] = previous ? hslOf(previous) : [0, 1, 0.5];
  return fromHsl(hue, saturation || 1, light || 0.5);
};

export default {
  ...text,
  icon      : 'lucide:palette',
  input     : 'color',
  look      : 'swatch',
  parse     : raw   => toHex(raw)   ?? '#000000',
  format    : value => toHex(value) ?? '#000000',
  steppable : false,

  axis : {
    bounds     : [0, 360],
    fromNumber : fromHue,
    step       : 1,
    toNumber   : hueOf,
  },
};
