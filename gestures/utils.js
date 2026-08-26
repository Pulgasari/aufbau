// utils.js

// :::::: 

// wheel deltas normalized to pixels regardless of deltaMode (line/page), so
// zoom feels the same across browsers and input devices.

const WHEEL_LINE = 16;
const WHEEL_PAGE = 400;
const normalizeWheel = event => {
  const unit = event.deltaMode === 1 ? WHEEL_LINE : event.deltaMode === 2 ? WHEEL_PAGE : 1;
  return { deltaX: event.deltaX * unit, deltaY: event.deltaY * unit };
};

const MODIFIER = { ctrl: 'ctrlKey', meta: 'metaKey', shift: 'shiftKey', alt: 'altKey' };

const NO_SELECT = {
  userSelect         : 'none',
  webkitUserSelect   : 'none',
  webkitTouchCallout : 'none'
};

// :::::: MATRIX

// a 2d affine matrix { a, b, c, d, e, f } — the same six numbers as
// CSSMatrix / `matrix(a,b,c,d,e,f)`. transformable accumulates one of these and
// hands back both the raw matrix and its decomposition, so callers can drive
// either `element.style.transform = matrix(...)` or discrete x/y/scale/rotation.

const mIdentityParts = (x, y, scale, rotation) => {
  const rad = rotation * Math.PI / 180;
  const cos = Math.cos(rad) * scale;
  const sin = Math.sin(rad) * scale;
  return { a: cos, b: sin, c: -sin, d: cos, e: x, f: y };
};

// m · n (apply n first, then m)
const mMultiply = (m, n) => ({
  a: m.a * n.a + m.c * n.b,
  b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d,
  d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e,
  f: m.b * n.e + m.d * n.f + m.f
});

const mTranslate = (x, y) => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });

// similarity (uniform scale + rotation, no shear) about the origin
const mScaleRotate = (scale, rad) => {
  const cos = Math.cos(rad) * scale;
  const sin = Math.sin(rad) * scale;
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
};

// exact for a similarity matrix (what we only ever build here)
const mDecompose = m => ({
  x        : m.e,
  y        : m.f,
  scale    : Math.hypot(m.a, m.b),
  rotation : Math.atan2(m.b, m.a) * 180 / Math.PI
});

// ::::::

export const 
clamp = (value, min, max) => Math.max(min, Math.min(max, value)),

// nearest of a fixed set, or nearest multiple of a step, or the value untouched.
snap = (value, steps) => !steps ? value
  : Array.isArray(steps) ? steps.reduce((prev, next) => Math.abs(next - value) < Math.abs(prev - value) ? next : prev)
  : Math.round(value / steps) * steps,

distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
angle    = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI,

// signed shortest difference between two angles in degrees, in (-180, 180].
angleDelta = (from, to) => { let d = (to - from) % 360; return d > 180 ? d - 360 : d <= -180 ? d + 360 : d; };

// ::::::

export {
  mDecompose,
  mIdentityParts,
  mMultiply,
  mScaleRotate,
  mTranslate,
  normalizeWheel,
};
