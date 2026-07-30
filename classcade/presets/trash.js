// presets/tokens.js

export const spacing = {
  0: '0px', px: '1px', 0.5: '0.125rem', 1: '0.25rem', 1.5: '0.375rem',
  2: '0.5rem', 2.5: '0.625rem', 3: '0.75rem', 3.5: '0.875rem', 4: '1rem',
  5: '1.25rem', 6: '1.5rem', 7: '1.75rem', 8: '2rem', 9: '2.25rem',
  10: '2.5rem', 11: '2.75rem', 12: '3rem', 14: '3.5rem', 16: '4rem',
  20: '5rem', 24: '6rem', 28: '7rem', 32: '8rem', 36: '9rem', 40: '10rem',
  44: '11rem', 48: '12rem', 52: '13rem', 56: '14rem', 60: '15rem',
  64: '16rem', 72: '18rem', 80: '20rem', 96: '24rem',
};

export const fontSize = {
  xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem',
  xl2: '1.5rem', xl3: '1.875rem', xl4: '2.25rem', xl5: '3rem',
  xl6: '3.75rem', xl7: '4.5rem', xl8: '6rem', xl9: '8rem',
};

export const fontWeight = {
  thin: '100', extralight: '200', light: '300', normal: '400', medium: '500',
  semibold: '600', bold: '700', extrabold: '800', black: '900',
};

export const radius = {
  none: '0px', sm: '0.125rem', base: '0.25rem', md: '0.375rem',
  lg: '0.5rem', xl: '0.75rem', xl2: '1rem', xl3: '1.5rem', full: '9999px',
};

export const shadow = {
  sm     : '0 1px 2px 0 rgba(0,0,0,0.05)',
  base   : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  md     : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg     : '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl     : '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
  xl2    : '0 25px 50px -12px rgba(0,0,0,0.25)',
  inner  : 'inset 0 2px 4px 0 rgba(0,0,0,0.05)',
  none   : 'none',
};

export const zIndex = { 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50', auto: 'auto' };

export const breakpoints = {
  sm: '(min-width: 640px)', md: '(min-width: 768px)',
  lg: '(min-width: 1024px)', xl: '(min-width: 1280px)', xl2: '(min-width: 1536px)',
};

export const colors = {
  black: '#000000', white: '#ffffff', transparent: 'transparent', current: 'currentColor',
  gray:    { 50:'#f9fafb', 100:'#f3f4f6', 200:'#e5e7eb', 300:'#d1d5db', 400:'#9ca3af', 500:'#6b7280', 600:'#4b5563', 700:'#374151', 800:'#1f2937', 900:'#111827' },
  red:     { 50:'#fef2f2', 100:'#fee2e2', 200:'#fecaca', 300:'#fca5a5', 400:'#f87171', 500:'#ef4444', 600:'#dc2626', 700:'#b91c1c', 800:'#991b1b', 900:'#7f1d1d' },
  orange:  { 50:'#fff7ed', 100:'#ffedd5', 200:'#fed7aa', 300:'#fdba74', 400:'#fb923c', 500:'#f97316', 600:'#ea580c', 700:'#c2410c', 800:'#9a3412', 900:'#7c2d12' },
  yellow:  { 50:'#fefce8', 100:'#fef9c3', 200:'#fef08a', 300:'#fde047', 400:'#facc15', 500:'#eab308', 600:'#ca8a04', 700:'#a16207', 800:'#854d0e', 900:'#713f12' },
  green:   { 50:'#f0fdf4', 100:'#dcfce7', 200:'#bbf7d0', 300:'#86efac', 400:'#4ade80', 500:'#22c55e', 600:'#16a34a', 700:'#15803d', 800:'#166534', 900:'#14532d' },
  teal:    { 50:'#f0fdfa', 100:'#ccfbf1', 200:'#99f6e4', 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6', 600:'#0d9488', 700:'#0f766e', 800:'#115e59', 900:'#134e4a' },
  blue:    { 50:'#eff6ff', 100:'#dbeafe', 200:'#bfdbfe', 300:'#93c5fd', 400:'#60a5fa', 500:'#3b82f6', 600:'#2563eb', 700:'#1d4ed8', 800:'#1e40af', 900:'#1e3a8a' },
  indigo:  { 50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc', 400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca', 800:'#3730a3', 900:'#312e81' },
  purple:  { 50:'#faf5ff', 100:'#f3e8ff', 200:'#e9d5ff', 300:'#d8b4fe', 400:'#c084fc', 500:'#a855f7', 600:'#9333ea', 700:'#7e22ce', 800:'#6b21a8', 900:'#581c87' },
  pink:    { 50:'#fdf2f8', 100:'#fce7f3', 200:'#fbcfe8', 300:'#f9a8d4', 400:'#f472b6', 500:'#ec4899', 600:'#db2777', 700:'#be185d', 800:'#9d174d', 900:'#831843' },
};

// :::::: resolution helpers - "scale lookup, else raw pass-through"
// this is the escape hatch for arbitrary values: anything not found in a
// scale is used as-is. Combined with quoted-string args in the parser
// (p["10px"]), this covers arbitrary values without needing dedicated
// bracket-value syntax.

export const scaleOr = (scale, value) => scale[value] ?? value;

export function resolveColor (value) {
  if (typeof colors[value] === 'string') return colors[value];
  const match = String(value).match(/^([a-z]+)-(\d{2,3})$/);
  if (match) {
    const [, hue, shade] = match;
    const palette = colors[hue];
    if (palette && palette[shade]) return palette[shade];
  }
  return value; // raw pass-through: hex, rgb(), var(...), css keyword, ...
}

// presets/colors.js
import { resolveColor, scaleOr, radius } from './tokens.js';

export default function colorsPreset (cc) {
  cc.add({ id: 'bg',           css: v => ({ 'background-color': resolveColor(v) }) });
  cc.add({ id: 'text',         css: v => ({ color: resolveColor(v) }) }); // note: collides with typography's text[size] - see typography.js
  cc.add({ id: 'border-color', css: v => ({ 'border-color': resolveColor(v) }) });
  cc.add({ id: 'fill',         css: v => ({ fill: resolveColor(v) }) });
  cc.add({ id: 'stroke',       css: v => ({ stroke: resolveColor(v) }) });

  cc.add({ id: 'opacity', css: v => ({ opacity: String(Number(v) / 100) }) });

  cc.add({ id: 'rounded',    css: (v = 'base') => ({ 'border-radius': scaleOr(radius, v) }) });
  cc.add({ id: 'rounded-t',  css: (v = 'base') => ({ 'border-top-left-radius': scaleOr(radius, v), 'border-top-right-radius': scaleOr(radius, v) }) });
  cc.add({ id: 'rounded-b',  css: (v = 'base') => ({ 'border-bottom-left-radius': scaleOr(radius, v), 'border-bottom-right-radius': scaleOr(radius, v) }) });

  cc.add({ id: 'border',  css: (v = '1') => (/^\d+$/.test(v) ? { 'border-width': `${v}px` } : { 'border-color': resolveColor(v) }) });
}

// presets/effects.js
import { shadow, scaleOr } from './tokens.js';

export default function effectsPreset (cc) {
  cc.add({ id: 'shadow', css: (v = 'base') => ({ 'box-shadow': scaleOr(shadow, v) }) });

  cc.add({ id: 'cursor', css: v => ({ cursor: v }) });

  cc.add({ id: 'transition', css: (v = 'all') => ({
    'transition-property': v === 'none' ? 'none' : v,
    'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'transition-duration': '150ms',
  }) });
  cc.add({ id: 'duration', css: v => ({ 'transition-duration': `${v}ms` }) });
  cc.add({ id: 'ease',     css: v => ({ 'transition-timing-function': v }) });

  cc.add({ id: 'scale',        css: v => ({ transform: `scale(${Number(v) / 100})` }) });
  cc.add({ id: 'rotate',       css: v => ({ transform: `rotate(${v}deg)` }) });
  cc.add({ id: 'translate-x',  css: v => ({ transform: `translateX(${v}px)` }) });
  cc.add({ id: 'translate-y',  css: v => ({ transform: `translateY(${v}px)` }) });
}

// presets/layout.js
import { scaleOr, spacing } from './tokens.js';

export default function layoutPreset (cc) {

  // display
  const displays = ['block','inline','inline-block','flex','inline-flex','grid','inline-grid','table','contents','hidden'];
  for (const d of displays) {
    cc.add({ id: d, css: () => ({ display: d === 'hidden' ? 'none' : d }) });
  }

  // position
  for (const p of ['static','relative','absolute','fixed','sticky']) {
    cc.add({ id: p, css: () => ({ position: p }) });
  }

  // inset / offsets
  const offset = prop => v => ({ [prop]: scaleOr(spacing, v) });
  cc.add({ id: 'inset',  css: v => ({ top: scaleOr(spacing, v), right: scaleOr(spacing, v), bottom: scaleOr(spacing, v), left: scaleOr(spacing, v) }) });
  cc.add({ id: 'top',    css: offset('top') });
  cc.add({ id: 'right',  css: offset('right') });
  cc.add({ id: 'bottom', css: offset('bottom') });
  cc.add({ id: 'left',   css: offset('left') });
  cc.add({ id: 'z',      css: v => ({ 'z-index': v }) });

  // overflow
  cc.add({ id: 'overflow',   css: v => ({ overflow:   v }) });
  cc.add({ id: 'overflow-x', css: v => ({ 'overflow-x': v }) });
  cc.add({ id: 'overflow-y', css: v => ({ 'overflow-y': v }) });

  // flex container
  cc.add({ id: 'flex-row',           css: () => ({ 'flex-direction': 'row' }) });
  cc.add({ id: 'flex-row-reverse',   css: () => ({ 'flex-direction': 'row-reverse' }) });
  cc.add({ id: 'flex-col',           css: () => ({ 'flex-direction': 'column' }) });
  cc.add({ id: 'flex-col-reverse',   css: () => ({ 'flex-direction': 'column-reverse' }) });
  cc.add({ id: 'flex-wrap',          css: () => ({ 'flex-wrap': 'wrap' }) });
  cc.add({ id: 'flex-nowrap',        css: () => ({ 'flex-wrap': 'nowrap' }) });
  cc.add({ id: 'flex-wrap-reverse',  css: () => ({ 'flex-wrap': 'wrap-reverse' }) });

  const alignMap = { start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch', baseline: 'baseline' };
  const justifyMap = { start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between', around: 'space-around', evenly: 'space-evenly' };

  cc.add({ id: 'items',   css: v => ({ 'align-items':    alignMap[v]   ?? v }) });
  cc.add({ id: 'content', css: v => ({ 'align-content':  alignMap[v]   ?? v }) });
  cc.add({ id: 'self',    css: v => ({ 'align-self':     v === 'auto' ? 'auto' : (alignMap[v] ?? v) }) });
  cc.add({ id: 'justify', css: v => ({ 'justify-content': justifyMap[v] ?? v }) });

  cc.add({ id: 'grow',   css: (v = '1') => ({ 'flex-grow':   v }) });
  cc.add({ id: 'shrink', css: (v = '1') => ({ 'flex-shrink': v }) });
  cc.add({ id: 'basis',  css: v => ({ 'flex-basis': scaleOr(spacing, v) }) });

  // grid container
  cc.add({ id: 'grid-cols',  css: v => ({ 'grid-template-columns': v === 'none' ? 'none' : `repeat(${v}, minmax(0, 1fr))` }) });
  cc.add({ id: 'grid-rows',  css: v => ({ 'grid-template-rows':    v === 'none' ? 'none' : `repeat(${v}, minmax(0, 1fr))` }) });
  cc.add({ id: 'col-span',   css: v => ({ 'grid-column': v === 'full' ? '1 / -1' : `span ${v} / span ${v}` }) });
  cc.add({ id: 'row-span',   css: v => ({ 'grid-row':    v === 'full' ? '1 / -1' : `span ${v} / span ${v}` }) });
  cc.add({ id: 'col-start',  css: v => ({ 'grid-column-start': v }) });
  cc.add({ id: 'row-start',  css: v => ({ 'grid-row-start':    v }) });

  cc.add({ id: 'gap',   css: v => ({ gap:        scaleOr(spacing, v) }) });
  cc.add({ id: 'gap-x', css: v => ({ 'column-gap': scaleOr(spacing, v) }) });
  cc.add({ id: 'gap-y', css: v => ({ 'row-gap':    scaleOr(spacing, v) }) });
}

// presets/methods.js
// method-nodes geben rohe CSS-Werte zurück (Strings), keine Rule-Objekte.
// Werden als Argumente in Rules verschachtelt genutzt, z.B. bg[rgba(0,0,0,0.5)]
export default function methodsPreset (cc) {
  cc.add({ id: 'rgba',  css: (r, g, b, a = '1') => `rgba(${r}, ${g}, ${b}, ${a})` });
  cc.add({ id: 'rgb',   css: (r, g, b) => `rgb(${r}, ${g}, ${b})` });
  cc.add({ id: 'hsl',   css: (h, s, l) => `hsl(${h}, ${s}, ${l})` });
  cc.add({ id: 'var',   css: (name, fallback) => fallback !== undefined ? `var(${name}, ${fallback})` : `var(${name})` });
  cc.add({ id: 'calc',  css: (...parts) => `calc(${parts.join(' ')})` });
  cc.add({ id: 'min',   css: (...parts) => `min(${parts.join(', ')})` });
  cc.add({ id: 'max',   css: (...parts) => `max(${parts.join(', ')})` });
  cc.add({ id: 'clamp', css: (min, val, max) => `clamp(${min}, ${val}, ${max})` });
}

// presets/sizing.js

import { scaleOr, spacing } from './tokens.js';

const extra  = { auto: 'auto', full: '100%', screen: '100vw', min: 'min-content', max: 'max-content', fit: 'fit-content' };
const extraH = { auto: 'auto', full: '100%', screen: '100vh', min: 'min-content', max: 'max-content', fit: 'fit-content' };

const resolve = (map, v) => map[v] ?? scaleOr(spacing, v);

export default function sizingPreset (cc) {
  cc.add({ id: 'w',      css: v => ({ width:      resolve(extra,  v) }) });
  cc.add({ id: 'h',      css: v => ({ height:     resolve(extraH, v) }) });
  cc.add({ id: 'min-w',  css: v => ({ 'min-width':  resolve(extra,  v) }) });
  cc.add({ id: 'min-h',  css: v => ({ 'min-height': resolve(extraH, v) }) });
  cc.add({ id: 'max-w',  css: v => ({ 'max-width':  resolve(extra,  v) }) });
  cc.add({ id: 'max-h',  css: v => ({ 'max-height': resolve(extraH, v) }) });
  cc.add({ id: 'size',   css: v => ({ width: resolve(extra, v), height: resolve(extraH, v) }) });
}

// presets/spacing.js
import { scaleOr, spacing } from './tokens.js';

const sides = {
  '' : ['margin','padding'],           // handled separately below (m / p)
  t  : 'top', r: 'right', b: 'bottom', l: 'left',
  x  : ['left', 'right'],
  y  : ['top', 'bottom'],
};

function declFor (base, sideKey, value) {
  const resolved = scaleOr(spacing, value);
  if (sideKey === '') return { [base]: resolved };
  const target = sides[sideKey];
  if (Array.isArray(target)) return Object.fromEntries(target.map(s => [`${base}-${s}`, resolved]));
  return { [`${base}-${target}`]: resolved };
}

export default function spacingPreset (cc) {
  for (const [prefix, base] of [['p', 'padding'], ['m', 'margin']]) {
    cc.add({ id: prefix,        css: v => declFor(base, '', v) });
    for (const sideKey of ['t', 'r', 'b', 'l', 'x', 'y']) {
      cc.add({ id: `${prefix}${sideKey}`, css: v => declFor(base, sideKey, v) });
    }
  }

  // negative margins: -mt[4] etc. would need a leading '-' the lexer treats
  // as PUNCT, not part of the identifier - not supported by the current
  // grammar. Workaround until then: m[-4] (value itself negative).
  cc.add({ id: 'space-x', css: v => ({ '--cc-space-x': scaleOr(spacing, v) }) }); // apply via `> * + *` in generator later if needed
  cc.add({ id: 'space-y', css: v => ({ '--cc-space-y': scaleOr(spacing, v) }) });
}

// presets/typography.js
import { fontSize, fontWeight, scaleOr, resolveColor } from './tokens.js';

export default function typographyPreset (cc) {
  // text[lg] -> font-size; text[red] / text[red-500] -> color (scale-first, else color fallback)
  cc.add({
    id: 'text',
    css: v => (v in fontSize) ? { 'font-size': fontSize[v] } : { color: resolveColor(v) },
  });

  cc.add({ id: 'font',    css: v => ({ 'font-weight': scaleOr(fontWeight, v) }) });
  cc.add({ id: 'leading', css: v => ({ 'line-height':   v }) });
  cc.add({ id: 'tracking',css: v => ({ 'letter-spacing': v }) });

  cc.add({ id: 'text-left',    css: () => ({ 'text-align': 'left' }) });
  cc.add({ id: 'text-center',  css: () => ({ 'text-align': 'center' }) });
  cc.add({ id: 'text-right',   css: () => ({ 'text-align': 'right' }) });
  cc.add({ id: 'text-justify', css: () => ({ 'text-align': 'justify' }) });

  cc.add({ id: 'uppercase',    css: () => ({ 'text-transform': 'uppercase' }) });
  cc.add({ id: 'lowercase',    css: () => ({ 'text-transform': 'lowercase' }) });
  cc.add({ id: 'capitalize',   css: () => ({ 'text-transform': 'capitalize' }) });
  cc.add({ id: 'normal-case',  css: () => ({ 'text-transform': 'none' }) });

  cc.add({ id: 'italic',       css: () => ({ 'font-style': 'italic' }) });
  cc.add({ id: 'not-italic',   css: () => ({ 'font-style': 'normal' }) });

  cc.add({ id: 'underline',    css: () => ({ 'text-decoration-line': 'underline' }) });
  cc.add({ id: 'line-through', css: () => ({ 'text-decoration-line': 'line-through' }) });
  cc.add({ id: 'no-underline', css: () => ({ 'text-decoration-line': 'none' }) });

  cc.add({ id: 'truncate', css: () => ({ overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }) });
  cc.add({ id: 'whitespace', css: v => ({ 'white-space': v }) });
}
