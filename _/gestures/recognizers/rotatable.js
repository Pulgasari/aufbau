// recognizers/rotatable.js

import { angle, angleDelta, midpoint } from './../utils.js';

// two-finger rotation in degrees, accumulated over the gesture (so it passes
// through ±180 cleanly), with the focal point it turns around.

function rotatable ({
  onRotate,
  onRotateEnd,
  onRotateStart,
} = {}) {
  const points = new Map;
  let active = false;
  let prev   = 0;   // last raw finger-pair angle
  let total  = 0;   // accumulated rotation

  const pair = () => [...points.values()];

  const fire = (fn, event) => {
    const [a, b] = pair();
    const now    = angle(a, b);
    const step   = angleDelta(prev, now);
    total += step;
    prev   = now;
    fn?.({ rotation: total, deltaRotation: step, focal: midpoint(a, b), event });
  };

  const down = event => {
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2) return;
    const [a, b] = pair();
    active = true;
    total  = 0;
    prev   = angle(a, b);
    onRotateStart?.({ rotation: 0, deltaRotation: 0, focal: midpoint(a, b), event });
  };

  const move = event => {
    if (!points.has(event.pointerId)) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size !== 2 || !active) return;
    if (event.cancelable) event.preventDefault();
    fire(onRotate, event);
  };

  const up = event => {
    if (active && points.size === 2) fire(onRotateEnd, event);
    points.delete(event.pointerId);
    if (points.size < 2) active = false;
  };

  return {
    handlers    : { 
      pointerdown   : down, 
      pointermove   : move, 
      pointerup     : up,
      pointercancel : up
    },
    touchAction : 'none',
    destroy     : () => { points.clear(); active = false; }
  };
}

export       { rotatable };
export default rotatable;
