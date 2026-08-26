// @aufbau/gestures/core.js
// pointer-driven gesture recognizers. every recognizer is a factory returning
// { handlers, style?, touchAction?, destroy?, set? }: `handlers` maps native event
// names to listeners and nothing binds itself, so the same factory works
// standalone, composed through gestures(), or behind a framework adapter (see
// adapters/). the composer is the only part that touches the dom.

// :::::: IMPORT

import { angle, angleDelta, clamp, distance, midpoint, snap } from './utils.js';

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














// the flagship: free move + scale + rotate of an object, one or two pointers,
// plus wheel zoom. it accumulates a 2d matrix by composing the frame-to-frame
// similarity transform between the pointers, so scaling and rotation happen
// around the finger (or cursor) focal point. every callback gets the decomposed
// { x, y, scale, rotation } and the raw `matrix` — apply it with
// `transform: matrix(...)` on an element whose transform-origin is 0 0.
export function transformable ({
  onTransformStart, onTransform, onTransformEnd,
  x = 0, y = 0, scale = 1, rotation = 0,
  minScale = 0.05, maxScale = 40,
  pan = true, zoom = true, rotate = true,
  wheel = true, wheelIntensity = 0.0015, wheelModifier = null
} = {}) {
  let matrix = mIdentityParts(x, y, scale, rotation);
  const points = new Map();
  let prev = null;   // previous-frame point snapshot
  let live = false;

  const snapshot = () => [...points.values()].map(p => ({ x: p.x, y: p.y }));

  // compose a screen-space similarity onto the accumulated matrix, clamping the
  // resulting scale about the focal so bounds hold without breaking the pivot.
  const apply = step => {
    let factor = zoom ? step.scale : 1;
    const current = Math.hypot(matrix.a, matrix.b);
    const next    = current * factor;
    if (next < minScale) factor = minScale / current;
    if (next > maxScale) factor = maxScale / current;

    const rad = rotate ? step.rotation : 0;
    const s   = mMultiply(mTranslate(step.to.x, step.to.y), mMultiply(mScaleRotate(factor, rad), mTranslate(-step.from.x, -step.from.y)));
    matrix    = mMultiply(s, matrix);
  };

  const emit = (fn, event, focal) => {
    const t = mDecompose(matrix);
    fn?.({ ...t, matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f], focal, event });
  };

  const down = event => {
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    prev = snapshot();
    if (points.size === 1) { live = true; emit(onTransformStart, event, prev[0]); }
  };

  const move = event => {
    if (!points.has(event.pointerId) || !live) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const curr = snapshot();
    if (curr.length !== prev.length) { prev = curr; return; }
    if (event.cancelable) event.preventDefault();

    let focal;
    if (curr.length === 1) {
      // single pointer only translates (when panning is on)
      apply({ from: pan ? prev[0] : curr[0], to: curr[0], scale: 1, rotation: 0 });
      focal = curr[0];
    } else {
      // the frame-to-frame similarity that maps the previous finger pair onto the
      // current one: T(to) · scaleRotate · T(-from). apply() gates zoom/rotate and
      // clamps the scale about the focal; from == to (no pan) keeps it in place.
      const pFrom = midpoint(prev[0], prev[1]);
      const pTo   = midpoint(curr[0], curr[1]);
      const scale = distance(curr[0], curr[1]) / (distance(prev[0], prev[1]) || 1);
      const rad   = angleDelta(angle(prev[0], prev[1]), angle(curr[0], curr[1])) * Math.PI / 180;
      apply({ from: pan ? pFrom : pTo, to: pTo, scale, rotation: rad });
      focal = pTo;
    }
    prev = curr;
    emit(onTransform, event, focal);
  };

  const up = event => {
    if (!points.has(event.pointerId)) return;
    points.delete(event.pointerId);
    prev = snapshot();
    if (points.size === 0) { live = false; emit(onTransformEnd, event, { x: event.clientX, y: event.clientY }); }
  };

  const onWheel = event => {
    if (!zoom || !wheel) return;
    if (wheelModifier && !event[MODIFIER[wheelModifier]]) return;
    event.preventDefault();
    const { deltaY } = normalizeWheel(event);
    const focal = { x: event.clientX, y: event.clientY };
    apply({ from: focal, to: focal, scale: Math.exp(-deltaY * wheelIntensity), rotation: 0 });
    emit(onTransform, event, focal);
  };

  return {
    handlers : {
      pointerdown   : down,
      pointermove   : move,
      pointerup     : up,
      pointercancel : up,
      ...(wheel ? { wheel: onWheel } : {})
    },
    touchAction : 'none',
    destroy     : () => { points.clear(); live = false; },
    set         : next => { matrix = mIdentityParts(next.x ?? 0, next.y ?? 0, next.scale ?? 1, next.rotation ?? 0); },
    get         : () => mDecompose(matrix)
  };
}

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

export adjustable from './adjustable.js';
export holdable   from './holdable.js';
export pannable   from './pannable.js';
export pinchable  from './pinchable.js';
export pressable  from './pressable.js';
export rotatable  from './rotatable.js';
export swipeable  from './swipeable.js';
export wheelable  from './wheelable.js';
