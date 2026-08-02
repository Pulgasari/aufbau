// gestures.js

//============| HELPERS |============//

let clamp = (value, min, max) => Math.max(min, Math.min(max, value));

let snap = (value, steps) =>
  !steps                ? value
  : Array.isArray(steps) ? steps.reduce((p, c) => Math.abs(c - value) < Math.abs(p - value) ? c : p)
  : Math.round(value / steps) * steps;

let NO_SELECT = {
  userSelect          : 'none',
  webkitUserSelect    : 'none',
  webkitTouchCallout  : 'none'
};

/* Every gesture factory returns { handlers, style?, destroy? }.
   `handlers` maps native event names to listeners — nothing is bound here,
   so the same factory works standalone, inside `gestures()` or in a wrapper. */

//============| GESTURES |============//

export let pressable = ({ onClick, onLongClick, threshold = 500, tolerance = 8 } = {}) => {
  let timer = null;
  let id    = null;
  let long  = false;
  let x     = 0;
  let y     = 0;

  let reset = () => {
    clearTimeout(timer);
    timer = null;
    id    = null;
    long  = false;
  };

  let down = event => {
    if (!event.isPrimary || id !== null) return;
    id    = event.pointerId;
    long  = false;
    x     = event.clientX;
    y     = event.clientY;
    event.currentTarget.setPointerCapture?.(id);
    timer = setTimeout(() => { long = true; onLongClick?.(event); }, threshold);
  };

  let move = event => {
    if (event.pointerId !== id || timer === null) return;
    if (Math.hypot(event.clientX - x, event.clientY - y) > tolerance) reset();
  };

  let up = event => {
    if (event.pointerId !== id) return;
    if (!long && timer !== null) onClick?.(event);
    reset();
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
    destroy : reset
  };
};

export let holdable = ({ onHold, delay = 500, speed = 100 } = {}) => {
  let timer    = null;
  let interval = null;
  let id       = null;
  let count    = 0;

  let stop = () => {
    clearTimeout(timer);
    clearInterval(interval);
    timer = interval = id = null;
  };

  let down = event => {
    if (!event.isPrimary || id !== null) return;
    id    = event.pointerId;
    count = 0;
    event.currentTarget.setPointerCapture?.(id);
    if (event.cancelable) event.preventDefault();

    onHold?.(count);
    timer = setTimeout(() => {
      interval = setInterval(() => onHold?.(++count), speed);
    }, delay);
  };

  let up = event => {
    if (event.pointerId === id) stop();
  };

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
};

export let swipeable = ({
  onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight,
  threshold     = 50,
  holdTime      = 0,
  preventScroll = false
} = {}) => {
  let id = null;
  let x  = 0;
  let y  = 0;
  let t  = 0;

  let down = event => {
    if (!event.isPrimary || id !== null) return;
    id = event.pointerId;
    x  = event.clientX;
    y  = event.clientY;
    t  = Date.now();
  };

  let move = event => {
    if (event.pointerId === id && preventScroll && event.cancelable) event.preventDefault();
  };

  let up = event => {
    if (event.pointerId !== id) return;
    id = null;

    let deltaX   = event.clientX - x;
    let deltaY   = event.clientY - y;
    let duration = Date.now() - t;
    if (holdTime > 0 && duration < holdTime) return;

    let absX = Math.abs(deltaX);
    let absY = Math.abs(deltaY);
    if (Math.max(absX, absY) < threshold) return;

    let direction = absX > absY
      ? deltaX > 0 ? 'right' : 'left'
      : deltaY > 0 ? 'down'  : 'up';

    let payload = { direction, deltaX, deltaY, duration, event };

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
    destroy : () => { id = null; }
  };
};

export let pannable = ({ onPanStart, onPan, onPanEnd, tolerance = 8 } = {}) => {
  let id     = null;
  let active = false;
  let x      = 0;
  let y      = 0;
  let lastX  = 0;
  let lastY  = 0;

  let payload = event => ({
    deltaX : event.clientX - x,
    deltaY : event.clientY - y,
    stepX  : event.clientX - lastX,
    stepY  : event.clientY - lastY,
    event
  });

  let down = event => {
    if (!event.isPrimary || id !== null) return;
    id     = event.pointerId;
    active = false;
    x = lastX = event.clientX;
    y = lastY = event.clientY;
    event.currentTarget.setPointerCapture?.(id);
  };

  let move = event => {
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

  let up = event => {
    if (event.pointerId !== id) return;
    if (active) onPanEnd?.(payload(event));
    id     = null;
    active = false;
  };

  return {
    handlers : {
      pointerdown   : down,
      pointermove   : move,
      pointerup     : up,
      pointercancel : up
    },
    style   : { touchAction: 'none', ...NO_SELECT },
    destroy : () => { id = null; active = false; }
  };
};

/* adjustable — two-finger resize.
   The orientation of the finger pair decides the axis:
   side by side → 'x', stacked → 'y', diagonal → 'both'.
   Pass axis: 'x' | 'y' | 'both' to lock it. */
export let adjustable = ({
  onAdjust,
  value     = 48,
  min       = 48,
  max       = 256,
  steps     = null,
  axis      = 'auto',
  wheelStep = 16,
  wheel     = true
} = {}) => {
  let points  = new Map();
  let current = value;
  let start   = null;

  let spread = () => {
    let [a, b] = [...points.values()];
    let dx = Math.abs(a.x - b.x);
    let dy = Math.abs(a.y - b.y);
    return { dx, dy, d: Math.hypot(dx, dy) };
  };

  let pick = ({ dx, dy }) =>
    axis !== 'auto' ? axis
    : dx > dy * 2   ? 'x'
    : dy > dx * 2   ? 'y'
    : 'both';

  let measure = s => start.axis === 'x' ? s.dx : start.axis === 'y' ? s.dy : s.d;

  let emit = (element, next, final, usedAxis) => {
    current = clamp(final ? snap(next, steps) : next, min, max);
    onAdjust?.(current, { axis: usedAxis, final, element });
  };

  let down = event => {
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2) return;
    let s = spread();
    start = { axis: pick(s), base: measure({ ...s, dx: s.dx, dy: s.dy }), value: current };
    // measure() needs start.axis, so recompute now that it exists
    start.base = measure(s);
  };

  let move = event => {
    if (!points.has(event.pointerId)) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2 || !start || start.base <= 0) return;
    if (event.cancelable) event.preventDefault();
    emit(event.currentTarget, start.value * (measure(spread()) / start.base), false, start.axis);
  };

  let up = event => {
    let element = event.currentTarget;
    points.delete(event.pointerId);
    if (start && points.size < 2) {
      emit(element, current, true, start.axis);
      start = null;
    }
  };

  let onWheel = event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    let step = typeof steps === 'number' ? steps : wheelStep;
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
    style   : { touchAction: 'pan-x pan-y' },
    destroy : () => { points.clear(); start = null; },
    set     : next => { current = clamp(next, min, max); }
  };
};

//============| COMPOSE |============//

let FACTORIES = [
  ['pressable',  pressable,  o => o.onClick || o.onLongClick],
  ['holdable',   holdable,   o => o.onHold],
  ['swipeable',  swipeable,  o => o.onSwipe || o.onSwipeUp || o.onSwipeDown || o.onSwipeLeft || o.onSwipeRight],
  ['pannable',   pannable,   o => o.onPan || o.onPanStart || o.onPanEnd],
  ['adjustable', adjustable, o => o.onAdjust]
];

/* gestures(element, options) — binds every gesture whose callbacks are present.
   Shared option names can be scoped per gesture:
     gestures(el, { onClick, onSwipe, pressable: { threshold: 700 } }) */
export let gestures = (element, options = {}) => {
  let parts = FACTORIES
    .filter(([, , active]) => active(options))
    .map(([name, factory]) => factory({ ...options, ...options[name] }));

  let groups = {};
  let bound  = {};

  for (let part of parts) {
    Object.assign(element.style, part.style);
    for (let type in part.handlers) (groups[type] ||= []).push(part.handlers[type]);
  }

  for (let type in groups) {
    bound[type] = event => { for (let handler of groups[type]) handler(event); };
    element.addEventListener(type, bound[type], { passive: false });
  }

  return {
    parts,
    destroy() {
      for (let type in bound) element.removeEventListener(type, bound[type]);
      for (let part of parts) part.destroy?.();
    }
  };
};
