// @aufbau/webfonts/fonts.json5
//
// single source of truth for the collection.
// consumed by the preview page, the per-font css generator and (later) the js api.
//
// license values must be verified per font before publishing.
// commercial: false means the font may be shown here but not shipped in a paid product.

const fonts = [
// ::: fraktur / blackletter :::::::::::::::::::::::::::::::

// ::: mono ::::::::::::::::::::::::::::::::::::::::::::::::

{
  id         : 'jetbrains-mono',
  name       : 'JetBrains Mono',
  designer   : 'JetBrains',
  source     : 'https://www.jetbrains.com/lp/mono/',
  license    : 'OFL-1.1',
  commercial : true,
  category   : 'mono',
  fallback   : 'monospace',
  features   : ['calt'],
  faces      : [
    { weight: '100 800', style: 'normal', file: 'jetbrains-mono/jetbrains-mono-variable.woff2' },
  ],
},

// ::: sans ::::::::::::::::::::::::::::::::::::::::::::::::

{
  id         : 'manrope',
  name       : 'Manrope',
  designer   : null,
  source     : null,
  license    : null,
  commercial : true,
  category   : 'sans',
  fallback   : 'sans-serif',
  features   : [],
  faces      : [
    // variable: weight is a range, the preview clamps its slider to it
    { weight: '100 900', style: 'normal', file: 'ttf/manrope.ttf' },
  ],
},

// ::: serif :::::::::::::::::::::::::::::::::::::::::::::::

{
  id         : 'vollkorn',
  name       : 'Vollkorn',
  designer   : 'Friedrich Althausen',
  source     : 'https://vollkorn-typeface.com/',
  license    : 'OFL-1.1',
  commercial : true,
  category   : 'serif',
  fallback   : 'serif',
  features   : ['liga', 'onum'],
  faces      : [
    { weight: 400, style: 'normal', file: 'vollkorn/vollkorn-400.woff2' },
    { weight: 700, style: 'normal', file: 'vollkorn/vollkorn-700.woff2' },
  ],
},

]; // end: fonts

