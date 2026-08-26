// compose.js

// :::::: IMPORT

import { 
  angle, 
  angleDelta, 
  clamp, 
  distance,
  midpoint, 
  snap
} from './utils.js';

import {
  adjustable,
  holdable,
  pannable,
  pinchable,
  pressable,
  rotatable,
  swipeable,
  transformable,
  wheelable,
} from './recognizers/index.js';

// ::::::

const FACTORIES = [
  ['adjustable',    adjustable,    o => o.onAdjust],
  ['holdable',      holdable,      o => o.onHold],
  ['pannable',      pannable,      o => o.onPan || o.onPanStart || o.onPanEnd],
  ['pinchable',     pinchable,     o => o.onPinch || o.onPinchStart || o.onPinchEnd],
  ['pressable',     pressable,     o => o.onClick || o.onDoubleClick || o.onLongClick],
  ['rotatable',     rotatable,     o => o.onRotate || o.onRotateStart || o.onRotateEnd],
  ['swipeable',     swipeable,     o => o.onSwipe || o.onSwipeUp || o.onSwipeDown || o.onSwipeLeft || o.onSwipeRight],     
  ['transformable', transformable, o => o.onTransform || o.onTransformStart || o.onTransformEnd],
  ['wheelable',     wheelable,     o => o.onWheel],
];

// most-restrictive wins when several recognizers want different touch-actions,
// so composing e.g. a pan (needs 'none') with an adjust ('pan-x pan-y') doesn't
// let the looser one re-enable native scrolling under the drag.
const TOUCH_RANK = { none: 3, 'pan-x': 2, 'pan-y': 2, 'pan-x pan-y': 1, manipulation: 1 };
const stricter   = (a, b) => (TOUCH_RANK[b] ?? 0) > (TOUCH_RANK[a] ?? 0) ? b : a;

// gestures(element, options) — binds every recognizer whose callbacks are present.
// shared option names can be scoped per recognizer:
//   gestures(el, { onClick, onSwipe, pressable: { threshold: 700 } })
function compose (element, options = {}) {
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

export       { compose };
export default compose;
