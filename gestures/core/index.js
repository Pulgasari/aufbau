// @aufbau/gestures/core.js
// pointer-driven gesture recognizers. every recognizer is a factory returning
// { handlers, style?, touchAction?, destroy?, set? }: `handlers` maps native event
// names to listeners and nothing binds itself, so the same factory works
// standalone, composed through gestures(), or behind a framework adapter (see
// adapters/). the composer is the only part that touches the dom.

// :::::: IMPORT

import { angle, angleDelta, clamp, distance, midpoint, snap } from './utils.js';

import adjustable    from './adjustable.js';
import holdable      from './holdable.js';
import pannable      from './pannable.js';
import pinchable     from './pinchable.js';
import pressable     from './pressable.js';
import rotatable     from './rotatable.js';
import swipeable     from './swipeable.js';
import transformable from './transformable.js';
import wheelable     from './wheelable.js';

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

// :::::: RECOGNIZERS

// :::::: COMPOSE

const FACTORIES = [
  ['pressable',     pressable,     o => o.onClick || o.onDoubleClick || o.onLongClick],
  ['holdable',      holdable,      o => o.onHold],
  ['swipeable',     swipeable,     o => o.onSwipe || o.onSwipeUp || o.onSwipeDown || o.onSwipeLeft || o.onSwipeRight],
  ['pannable',      pannable,      o => o.onPan || o.onPanStart || o.onPanEnd],
  ['pinchable',     pinchable,     o => o.onPinch || o.onPinchStart || o.onPinchEnd],
  ['rotatable',     rotatable,     o => o.onRotate || o.onRotateStart || o.onRotateEnd],
  ['wheelable',     wheelable,     o => o.onWheel],
  ['adjustable',    adjustable,    o => o.onAdjust],
  ['transformable', transformable, o => o.onTransform || o.onTransformStart || o.onTransformEnd]
];

// most-restrictive wins when several recognizers want different touch-actions,
// so composing e.g. a pan (needs 'none') with an adjust ('pan-x pan-y') doesn't
// let the looser one re-enable native scrolling under the drag.
const TOUCH_RANK = { none: 3, 'pan-x': 2, 'pan-y': 2, 'pan-x pan-y': 1, manipulation: 1 };
const stricter   = (a, b) => (TOUCH_RANK[b] ?? 0) > (TOUCH_RANK[a] ?? 0) ? b : a;

// gestures(element, options) — binds every recognizer whose callbacks are present.
// shared option names can be scoped per recognizer:
//   gestures(el, { onClick, onSwipe, pressable: { threshold: 700 } })
export function gestures (element, options = {}) {
  const parts = FACTORIES
    .filter(([, , active]) => active(options))
    .map(([name, factory]) => factory({ ...options, ...options[name] }));

  const groups = {};
  const bound  = {};
  let   touch  = null;

  for (const part of parts) {
    if (part.style) Object.assign(element.style, part.style);
    if (part.touchAction) touch = touch === null ? part.touchAction : stricter(touch, part.touchAction);
    for (const type in part.handlers) (groups[type] ||= []).push(part.handlers[type]);
  }
  if (touch) element.style.touchAction = touch;

  for (const type in groups) {
    bound[type] = event => { for (const handler of groups[type]) handler(event); };
    element.addEventListener(type, bound[type], { passive: false });
  }

  return {
    parts,
    destroy () {
      for (const type in bound) element.removeEventListener(type, bound[type]);
      for (const part of parts) part.destroy?.();
    }
  };
}

// :::::: EXPORT

export { angle, clamp, distance, midpoint, snap };

export adjustable    from './adjustable.js';
export holdable      from './holdable.js';
export pannable      from './pannable.js';
export pinchable     from './pinchable.js';
export pressable     from './pressable.js';
export rotatable     from './rotatable.js';
export swipeable     from './swipeable.js';
export transformable from './transformable.js';
export wheelable     from './wheelable.js';
