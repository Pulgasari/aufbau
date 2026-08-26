// @aufbau/gestures/core.js
// pointer-driven gesture recognizers. every recognizer is a factory returning
// { handlers, style?, touchAction?, destroy?, set? }: `handlers` maps native event
// names to listeners and nothing binds itself, so the same factory works
// standalone, composed through gestures(), or behind a framework adapter (see
// adapters/). the composer is the only part that touches the dom.

// :::::: HELPERS

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// nearest of a fixed set, or nearest multiple of a step, or the value untouched.
const snap = (value, steps) =>
    !steps               ? value
  : Array.isArray(steps) ? steps.reduce((prev, next) => Math.abs(next - value) < Math.abs(prev - value) ? next : prev)
  : Math.round(value / steps) * steps;

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const NO_SELECT = {
  userSelect         : 'none',
  webkitUserSelect   : 'none',
  webkitTouchCallout : 'none'
};

// :::::: RECOGNIZERS

// tap, double-tap and long-press on a single pointer. when onDoubleClick is set
// the single click is deferred by doubleWithin so the two can be told apart —
// without it, onClick fires immediately (no added latency). movement past
// tolerance, or a hold past threshold, cancels the click.
export function pressable ({ onClick, onDoubleClick, onLongClick, threshold = 500, tolerance = 8, doubleWithin = 300 } = {}) {
  let timer   = null;
  let single  = null;
  let id      = null;
  let moved   = false;
  let long    = false;
  let x       = 0;
  let y       = 0;
  let lastTap = 0;

  const clearLong = () => { clearTimeout(timer); timer = null; };
  const reset     = () => { clearLong(); id = null; moved = false; long = false; };

  const down = event => {
    if (!event.isPrimary || id !== null) return;
    id = event.pointerId; moved = false; long = false;
    x  = event.clientX; y = event.clientY;
    event.currentTarget.setPointerCapture?.(id);
    if (onLongClick) timer = setTimeout(() => { long = true; onLongClick(event); }, threshold);
  };

  const move = event => {
    if (event.pointerId !== id || moved) return;
    if (Math.hypot(event.clientX - x, event.clientY - y) > tolerance) { moved = true; clearLong(); }
  };

  const up = event => {
    if (event.pointerId !== id) return;
    const dead = moved || long;
    reset();
    if (dead) return;

    const now = event.timeStamp || Date.now();
    if (onDoubleClick && now - lastTap < doubleWithin) {
      clearTimeout(single); single = null;
      lastTap = 0;
      onDoubleClick(event);
      return;
    }
    lastTap = now;
    if (onDoubleClick) single = setTimeout(() => { single = null; onClick?.(event); }, doubleWithin);
    else onClick?.(event);
  };

  return {
    handlers : {
      pointerdown   : down,
      pointermove   : move,
      pointerup     : up,
      pointercancel : reset,
      contextmenu   : event => event.preventDefault()
    },
    style   : NO_SELECT,
    destroy : () => { clearTimeout(single); reset(); }
  };
}

// fires onHold(count) once on press, then repeatedly while held: after `delay`,
// every `speed` ms. the classic press-and-repeat button (e.g. a stepper).
export function holdable ({ onHold, delay = 500, speed = 100 } = {}) {
  let timer    = null;
  let interval = null;
  let id       = null;
  let count    = 0;

  const stop = () => { clearTimeout(timer); clearInterval(interval); timer = interval = id = null; };

  const down = event => {
    if (!event.isPrimary || id !== null) return;
    id = event.pointerId; count = 0;
    event.currentTarget.setPointerCapture?.(id);
    if (event.cancelable) event.preventDefault();
    onHold?.(count);
    timer = setTimeout(() => { interval = setInterval(() => onHold?.(++count), speed); }, delay);
  };

  const up = event => { if (event.pointerId === id) stop(); };

  return {
    handlers : {
      pointerdown   : down,
      pointerup     : up,
      pointercancel : stop,
      pointerleave  : up,
      contextmenu   : event => event.preventDefault()
    },
    style   : NO_SELECT,
    destroy : stop
  };
}

// directional flick. resolves to one of up/down/left/right past `threshold`,
// optionally only when the gesture was quick enough (`holdTime`). set
// preventScroll to lock the axis while swiping.
export function swipeable ({
  onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight,
  threshold     = 50,
  holdTime      = 0,
  preventScroll = false
} = {}) {
  let id = null;
  let x  = 0;
  let y  = 0;
  let t  = 0;

  const down = event => {
    if (!event.isPrimary || id !== null) return;
    id = event.pointerId; x = event.clientX; y = event.clientY; t = Date.now();
  };

  const move = event => {
    if (event.pointerId === id && preventScroll && event.cancelable) event.preventDefault();
  };

  const up = event => {
    if (event.pointerId !== id) return;
    id = null;

    const deltaX   = event.clientX - x;
    const deltaY   = event.clientY - y;
    const duration = Date.now() - t;
    if (holdTime > 0 && duration < holdTime) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (Math.max(absX, absY) < threshold) return;

    const direction = absX > absY
      ? deltaX > 0 ? 'right' : 'left'
      : deltaY > 0 ? 'down'  : 'up';

    const payload = { direction, deltaX, deltaY, duration, event };
    onSwipe?.(payload);
    ({ up: onSwipeUp, down: onSwipeDown, left: onSwipeLeft, right: onSwipeRight })[direction]?.(payload);
  };

  return {
    handlers : {
      pointerdown   : down,
      pointermove   : move,
      pointerup     : up,
      pointercancel : () => { id = null; },
      pointerleave  : up
    },
    touchAction : preventScroll ? 'none' : undefined,
    destroy     : () => { id = null; }
  };
}

// single-pointer drag. the gesture only starts once the pointer leaves the
// `tolerance` radius, then reports total delta (from start) and per-move step.
export function pannable ({ onPanStart, onPan, onPanEnd, tolerance = 8 } = {}) {
  let id     = null;
  let active = false;
  let x      = 0;
  let y      = 0;
  let lastX  = 0;
  let lastY  = 0;

  const payload = event => ({
    deltaX : event.clientX - x,
    deltaY : event.clientY - y,
    stepX  : event.clientX - lastX,
    stepY  : event.clientY - lastY,
    event
  });

  const down = event => {
    if (!event.isPrimary || id !== null) return;
    id = event.pointerId; active = false;
    x = lastX = event.clientX;
    y = lastY = event.clientY;
    event.currentTarget.setPointerCapture?.(id);
  };

  const move = event => {
    if (event.pointerId !== id) return;
    if (!active) {
      if (Math.hypot(event.clientX - x, event.clientY - y) < tolerance) return;
      active = true;
      onPanStart?.(payload(event));
    }
    if (event.cancelable) event.preventDefault();
    onPan?.(payload(event));
    lastX = event.clientX;
    lastY = event.clientY;
  };

  const up = event => {
    if (event.pointerId !== id) return;
    if (active) onPanEnd?.(payload(event));
    id = null; active = false;
  };

  return {
    handlers : {
      pointerdown   : down,
      pointermove   : move,
      pointerup     : up,
      pointercancel : up
    },
    style       : NO_SELECT,
    touchAction : 'none',
    destroy     : () => { id = null; active = false; }
  };
}

// two-finger resize mapped to a single clamped scalar (a cell/element size).
// the finger pair's orientation picks the axis — side by side -> 'x', stacked ->
// 'y', diagonal -> 'both'; lock it with axis: 'x' | 'y' | 'both'. ctrl/cmd + wheel
// nudges the same value on the desktop.
export function adjustable ({
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

// :::::: COMPOSE

const FACTORIES = [
  ['pressable',  pressable,  o => o.onClick || o.onDoubleClick || o.onLongClick],
  ['holdable',   holdable,   o => o.onHold],
  ['swipeable',  swipeable,  o => o.onSwipe || o.onSwipeUp || o.onSwipeDown || o.onSwipeLeft || o.onSwipeRight],
  ['pannable',   pannable,   o => o.onPan || o.onPanStart || o.onPanEnd],
  ['adjustable', adjustable, o => o.onAdjust]
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

export { clamp, distance, midpoint, snap };
