// @aufbau/gestures2/shared.js

// movement below the tolerance does not count as moving, a finger is less exact
// than a mouse. a number applies to every input
const TOLERANCE = { mouse: 4, pen: 8, touch: 10 };

const toleranceFor = (tolerance, input) =>
  typeof tolerance === 'number' ? tolerance : (tolerance?.[input] ?? TOLERANCE[input] ?? TOLERANCE.touch);

// no text selection, no callout, no native drag while a gesture holds the element
const NO_SELECT = {
  userSelect         : 'none',
  webkitTouchCallout : 'none',
  webkitUserDrag     : 'none',
  webkitUserSelect   : 'none',
};

// the strictest touch-action wins: a pan that needs 'none' must not be undone by
// a tap that is fine with 'manipulation'
const TOUCH_ACTION_RANK = { 'auto': 0, 'manipulation': 1, 'pan-x pan-y': 1, 'pan-x': 2, 'pan-y': 2, 'none': 3 };

const stricterTouchAction = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  if ((a === 'pan-x' && b === 'pan-y') || (a === 'pan-y' && b === 'pan-x')) return 'none';
  return (TOUCH_ACTION_RANK[b] ?? 0) > (TOUCH_ACTION_RANK[a] ?? 0) ? b : a;
};

// wheel deltas in pixels whatever the deltaMode (lines, pages)
const WHEEL_UNIT = { 0: 1, 1: 16, 2: 400 };
const normalizeWheel = event => ({ x: event.deltaX * WHEEL_UNIT[event.deltaMode], y: event.deltaY * WHEEL_UNIT[event.deltaMode] });

const modifiersOf = event => ({ alt: event.altKey, control: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey });

// a session for input that brings no pointers: a trackpad pinch or rotation, a
// wheel. the same fields as the tracker's, so handlers do not need to care
function inputSession (element, event, input) {
  const point = { x: event.clientX, y: event.clientY };
  return {
    angle           : 0,
    buttons         : 0,
    center          : point,
    claims          : new Set,
    delta           : { x: 0, y: 0 },
    direction       : null,
    distance        : 0,
    duration        : 0,
    element,
    input,
    maximumPointers : 0,
    modifiers       : modifiersOf(event),
    movement        : { x: 0, y: 0 },
    phase           : 'start',
    pointers        : 0,
    rotation        : 0,
    scale           : 1,
    start           : point,
    startTime       : event.timeStamp,
    target          : event.target,
    travel          : 0,
    velocity        : { speed: 0, x: 0, y: 0 },
  };
}

// continuous input without an end of its own (wheel events) ends after a pause
const IDLE = 150;

export { IDLE, NO_SELECT, TOLERANCE, inputSession, modifiersOf, normalizeWheel, stricterTouchAction, toleranceFor };
