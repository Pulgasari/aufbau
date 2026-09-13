// @aufbau/ass/longhands.js
// shorthand -> longhands. a name defined via @default on a shorthand also
// resolves on the matching longhand properties (spec: "these become also
// available on padding-left etc."). intentionally small; extend as needed.

export const LONGHANDS = {
  'border-color'  : ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
  'border-radius' : ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
  'border-width'  : ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
  'gap'           : ['row-gap', 'column-gap'],
  'inset'         : ['top', 'right', 'bottom', 'left'],
  'margin'        : ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  'padding'       : ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
};

export default LONGHANDS;
