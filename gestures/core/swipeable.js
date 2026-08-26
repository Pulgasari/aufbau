// gestures/core/swipeable.js

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
