// core/pannable.js

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
