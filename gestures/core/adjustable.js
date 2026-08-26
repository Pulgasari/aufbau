// core/adjustable.js

// two-finger resize mapped to a single clamped scalar (a cell/element size).
// the finger pair's orientation picks the axis — side by side -> 'x', stacked ->
// 'y', diagonal -> 'both'; lock it with axis: 'x' | 'y' | 'both'. ctrl/cmd + wheel
// nudges the same value on the desktop.

function adjustable ({
  onAdjust,
  value     = 48,
  min       = 48,
  max       = 256,
  steps     = null,
  axis      = 'auto',
  wheelStep = 16,
  wheel     = true
} = {}) {
  const points  = new Map();
  let   current = value;
  let   start   = null;

  const spread = () => {
    const [a, b] = [...points.values()];
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return { dx, dy, d: Math.hypot(dx, dy) };
  };

  const pick = ({ dx, dy }) =>
      axis !== 'auto' ? axis
    : dx > dy * 2      ? 'x'
    : dy > dx * 2      ? 'y'
    : 'both';

  const measure = s => start.axis === 'x' ? s.dx : start.axis === 'y' ? s.dy : s.d;

  const emit = (element, next, final, usedAxis) => {
    current = clamp(final ? snap(next, steps) : next, min, max);
    onAdjust?.(current, { axis: usedAxis, final, element });
  };

  const down = event => {
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2) return;
    const s = spread();
    start = { axis: pick(s), base: 0, value: current };
    start.base = measure(s);   // measure() needs start.axis, so set it after
  };

  const move = event => {
    if (!points.has(event.pointerId)) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2 || !start || start.base <= 0) return;
    if (event.cancelable) event.preventDefault();
    emit(event.currentTarget, start.value * (measure(spread()) / start.base), false, start.axis);
  };

  const up = event => {
    const element = event.currentTarget;
    points.delete(event.pointerId);
    if (start && points.size < 2) { emit(element, current, true, start.axis); start = null; }
  };

  const onWheel = event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const step = typeof steps === 'number' ? steps : wheelStep;
    emit(event.currentTarget, current + (event.deltaY > 0 ? -step : step), true, 'both');
  };

  return {
    handlers : {
      pointerdown   : down,
      pointermove   : move,
      pointerup     : up,
      pointercancel : up,
      ...(wheel ? { wheel: onWheel } : {})
    },
    touchAction : 'pan-x pan-y',
    destroy     : () => { points.clear(); start = null; },
    set         : next => { current = clamp(next, min, max); }
  };
}

export       { adjustable };
export default adjustable;
