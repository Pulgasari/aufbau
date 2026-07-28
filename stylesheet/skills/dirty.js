// @aufbau/stylesheet/skills/dirty.js

/**
 * Mapping of unique CSS values to their corresponding CSS property.
 */
const DIRTY_VALUE_MAP = {
  // cursor
  crosshair    : 'cursor',
  grab         : 'cursor',
  pointer      : 'cursor',

  // display
  block          : 'display',
  flex           : 'display',
  'inline-block' : 'display',
  'inline-flex'  : 'display',
  
  // font-family
  cursive      : 'font-family',
  fantasy      : 'font-family',
  monospace    : 'font-family',
  'sans-serif' : 'font-family',
  serif        : 'font-family',

  // font-style
  italic       : 'font-style',
  oblique      : 'font-style',

  // font-weight
  bold         : 'font-weight',
  bolder       : 'font-weight',
  lighter      : 'font-weight',

  // object-fit
  contain      : 'object-fit',
  cover        : 'object-fit',
  
  // position
  absolute     : 'position',
  fixed        : 'position',
  relative     : 'position',
  static       : 'position',
  sticky       : 'position',
  
  // text-align
  justify      : 'text-align',
  
  // text-transform
  capitalize   : 'text-transform',
  lowercase    : 'text-transform',
  uppercase    : 'text-transform',
};

/**
 * Transforms aufbau-dirty shorthand declarations into standard CSS properties.
 */
export function transformDirty(rawVal) {
  if (!rawVal) return '';

  const tokens = rawVal.trim().split(/\s+/);
  const matchedProps = new Map();

  for (const token of tokens) {
    const cleanToken = token.toLowerCase();
    const prop = DIRTY_VALUE_MAP[cleanToken];

    if (prop) {
      // Last value for a property wins
      matchedProps.set(prop, token);
    }
  }

  const declarations = [];
  for (const [prop, val] of matchedProps.entries()) {
    declarations.push(`${prop}:${val};`);
  }

  return declarations.join(' ');
}

export default transformDirty;
