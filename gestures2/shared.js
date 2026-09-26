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

export { NO_SELECT, TOLERANCE, stricterTouchAction, toleranceFor };
