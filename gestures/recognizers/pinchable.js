// recognizers/pinchable.js

import { distance, midpoint } from './../utils.js';

// two-finger pinch reported as a scale factor relative to the gesture start
// (start = 1), with the focal point (the finger midpoint) it pivots around.

function pinchable ({ onPinchStart, onPinch, onPinchEnd } = {}) {
  const points = new Map;
  let start = 0;   // finger distance when the pinch began (0 = idle)
  let last  = 1;

  const pair = () => [...points.values()];

  const fire = (fn, event) => {
    const [a, b] = pair();
    const scale  = distance(a, b) / start;
    fn?.({ scale, deltaScale: scale / last, focal: midpoint(a, b), event });
    last = scale;
  };

  const down = event => {
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2) return;
    const [a, b] = pair();
    start = distance(a, b) || 1;
    last  = 1;
    onPinchStart?.({ scale: 1, deltaScale: 1, focal: midpoint(a, b), event });
  };

  const move = event => {
    if (!points.has(event.pointerId)) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2 || !start) return;
    if (event.cancelable) event.preventDefault();
    fire(onPinch, event);
  };

  const up = event => {
    if (start && points.size === 2) fire(onPinchEnd, event);
    points.delete(event.pointerId);
    if (points.size < 2) start = 0;
  };

  return {
    handlers    : { pointerdown: down, pointermove: move, pointerup: up, pointercancel: up },
    touchAction : 'none',
    destroy     : () => { points.clear(); start = 0; }
  };
}

export       { pinchable };
export default pinchable;
