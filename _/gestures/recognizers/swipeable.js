// recognizers/swipeable.js

// directional flick. resolves to one of up/down/left/right past `threshold`,
// optionally only when the gesture was quick enough (`holdTime`).
//
// touch-action is derived from the directions the caller listens on: a purely
// horizontal set leaves vertical scrolling to the browser ('pan-y') and a purely
// vertical one leaves horizontal scrolling ('pan-x'). without any touch-action
// the browser claims the pointer for its own scroll gesture and fires
// pointercancel, so a touch swipe never resolves at all. a generic onSwipe wants
// all four directions and therefore has to take the element ('none') — pass
// touchAction to override any of this.
//
// the gesture resolves on a window-level pointerup rather than the element's own:
// a mouse flick that travels out of the element stops delivering events to it,
// so the element alone can only ever see a delta clipped to its edge. pointer
// capture would fix that too, but it also retargets the compatibility mouse
// events, which would swallow clicks on child buttons.

function swipeable ({
  onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight,
  threshold     = 50,
  holdTime      = 0,
  preventScroll = false,
  touchAction   = null
} = {}) {
  let id = null;
  let x  = 0;
  let y  = 0;
  let t  = 0;

  const horizontal = !!(onSwipeLeft || onSwipeRight);
  const vertical   = !!(onSwipeUp   || onSwipeDown);
  const action     =
      touchAction                ? touchAction
    : preventScroll || onSwipe    ? 'none'
    : horizontal && !vertical     ? 'pan-y'
    : vertical && !horizontal     ? 'pan-x'
    :                               'none';

  const listen = on => {
    const method = on ? 'addEventListener' : 'removeEventListener';
    window[method]('pointerup', up);
    window[method]('pointercancel', cancel);
  };

  const cancel = () => { id = null; listen(false); };

  const down = event => {
    if (!event.isPrimary || id !== null) return;
    id = event.pointerId; x = event.clientX; y = event.clientY; t = Date.now();
    listen(true);
  };

  const move = event => {
    if (event.pointerId === id && preventScroll && event.cancelable) event.preventDefault();
  };

  function up (event) {
    if (event.pointerId !== id) return;
    cancel();

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
  }

  return {
    handlers : {
      pointerdown : down,
      pointermove : move,
      dragstart   : event => event.preventDefault()   // a native image/link drag would cancel the pointer
    },
    touchAction : action,
    destroy     : cancel
  };
}

export       { swipeable };
export default swipeable;
