// recognizers/transformable.js

import { 
  angle, angleDelta, distance, midpoint, snap,
  mDecompose, mIdentityParts, mMultiply, mScaleRotate, mTranslate,
  normalizeWheel,
} from './../utils.js';

// the flagship: free move + scale + rotate of an object, one or two pointers,
// plus wheel zoom. it accumulates a 2d matrix by composing the frame-to-frame
// similarity transform between the pointers, so scaling and rotation happen
// around the finger (or cursor) focal point. every callback gets the decomposed
// { x, y, scale, rotation } and the raw `matrix` — apply it with
// `transform: matrix(...)` on an element whose transform-origin is 0 0.

function transformable ({
  onTransform,
  onTransformStart,
  onTransformEnd,
  x = 0, 
  y = 0, 
  rotation = 0,
  scale = 1, 
  minScale = 0.05, 
  maxScale = 40,
  pan = true, zoom = true, rotate = true,
  wheel = true,
  wheelIntensity = 0.0015,
  wheelModifier  = null
} = {}) {
  let matrix   = mIdentityParts(x, y, scale, rotation);
  const points = new Map;
  let prev     = null;   // previous-frame point snapshot
  let live     = false;

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

export       { transformable };
export default transformable;
