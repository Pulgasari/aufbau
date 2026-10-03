// @aufbau/elements2/core/valueTypes.js
// the value types of ../input/types/ in the flat shape <aufbau-value> and the
// aufbau-* controls read: { input, icon, parse, format, toNumber, fromNumber, step, bounds }.
// the types themselves live in input/types/, this only reshapes them.

import { TYPES } from '../input/types/index.js';

const plain = { bounds: [0, 100], fromNumber: number => String(number), step: 1, toNumber: value => Number(value) || 0 };

const flatten = type => ({ ...type, ...(type.axis ?? plain) });

// the list types (language, country, …) are no value type of a control
const VALUE_TYPES = Object.fromEntries(Object.entries(TYPES).filter(([, type]) => !type.list).map(([name, type]) => [name, flatten(type)]));

export const
TYPE_NAMES = Object.keys(VALUE_TYPES),
AXIS_TYPES = TYPE_NAMES.filter(name => TYPES[name].axis),
valueType  = name => VALUE_TYPES[name] ?? VALUE_TYPES.text;

export { VALUE_TYPES };
export { fromHsl, fromHue, hslOf, hueOf, toHex } from '../input/types/color.js';
export { DAY, MINUTE }                           from '../input/types/time.js';
