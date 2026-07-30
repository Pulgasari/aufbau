// presets/css.js

const CC  = {};
const CSS = {};

CSS.Fn = {
  calc  : { signature: [] },
  clamp : { signature: [] },
  
  hsl        : { signature: [] },
  light-dark : { signature: [] },
  rgb        : { signature: [] },
  rgba       : { signature: [] },
};

CSS.Type = {
  Color  : { values: ['currentColor'], fn: ['color-mix', 'hsl', 'rgb', 'rgba'] },
  Length : { units: ['em', 'pt, 'px', '%'] },
};


CC.Fn = {
  ld  : { fn: 'light-dark' },
};

CC.Prop  = {

  bg   : { prop: 'background-color' , unit: CSS.Type.Color },
  fg   : { prop: 'color'            , unit: CSS.Type.Color },
  fill : { prop: 'color'            , unit: CSS.Type.Color },

  gap : { prop: 'gap'     , unit: CSS.Type.Length },
  mar : { prop: 'margin'  , unit: CSS.Type.Length },
  pad : { prop: 'padding' , unit: CSS.Type.Length },

  ff  : { prop: 'font-family'    },
  tt  : { prop: 'text-transform' },
};







export default function methodsPreset (cc) {
  cc.add({ id: 'rgba',  css: (r, g, b, a = '1') => `rgba(${r}, ${g}, ${b}, ${a})` });
  cc.add({ id: 'rgb',   css: (r, g, b) => `rgb(${r}, ${g}, ${b})` });
  cc.add({ id: 'hsl',   css: (h, s, l) => `hsl(${h}, ${s}, ${l})` });
  cc.add({ id: 'var',   css: (name, fallback) => fallback !== undefined ? `var(${name}, ${fallback})` : `var(${name})` });
  cc.add({ id: 'calc',  css: (...parts) => `calc(${parts.join(' ')})` });
  cc.add({ id: 'min',   css: (...parts) => `min(${parts.join(', ')})` });
  cc.add({ id: 'max',   css: (...parts) => `max(${parts.join(', ')})` });
  cc.add({ id: 'clamp', css: (min, val, max) => `clamp(${min}, ${val}, ${max})` });
  cc.add({ id: 'rounded-b',  css: (v = 'base') => ({ 'border-bottom-left-radius': scaleOr(radius, v), 'border-bottom-right-radius': scaleOr(radius, v) }) });
  cc.add({ id: name, media: query });
  cc.add({ id: 'border',  css: (v = '1') => (/^\d+$/.test(v) ? { 'border-width': `${v}px` } : { 'border-color': resolveColor(v) }) });
    cc.add({ id: 'bg',           css: v => ({ 'background-color': resolveColor(v) }) });

}

const cc = {};

const quickies = Object.entries({
  bg  : 'background-color',
  fg  : 'color',
  opa : 'opacity',

  gap : 'gap',
  mar : 'margin',
  pad : 'padding',

  ff  : 'font-family',
  tt  : 'text-transform',

  // layout
  block  : { display: 'block' },
  flex   : { display: 'flex' },
  grid   : { display: 'grid' },
  hidden : { display: 'none' },
  inline : { display: 'inline' },

  //
  h : 'height',
  w : 'width',

  // typo
  bold      : { fontWeight: 'bold' },
  uppercase : { textTransform: 'uppercase' },
});

// these need also "type: 'rule'"
for (const [a,b] of quickies) cc.add(a,b);

