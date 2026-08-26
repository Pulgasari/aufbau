// core/pressable.js

// tap, double-tap and long-press on a single pointer. 
// when onDoubleClick is set the single click is deferred by doubleWithin 
// so the two can be told apart —
// without it, onClick fires immediately (no added latency).
// movement past tolerance, or a hold past threshold, cancels the click.

function pressable ({ onClick, onDoubleClick, onLongClick, threshold = 500, tolerance = 8, doubleWithin = 300 } = {}) {
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

export       { pressable };
export default pressable;
