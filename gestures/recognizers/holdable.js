// recognizers/holdable.js

// fires onHold(count) once on press, then repeatedly while held: after `delay`,
// every `speed` ms. the classic press-and-repeat button (e.g. a stepper).

import { NO_SELECT } from './../utils.js';

function holdable ({ 
  onHold,
  delay = 500,
  speed = 100,
} = {}) {
  let timer    = null;
  let interval = null;
  let id       = null;
  let count    = 0;

  const stop = () => { clearTimeout(timer); clearInterval(interval); timer = interval = id = null; };

  const down = event => {
    if (!event.isPrimary || id !== null) return;
    id = event.pointerId; count = 0;
    event.currentTarget.setPointerCapture?.(id);
    if (event.cancelable) event.preventDefault();
    onHold?.(count);
    timer = setTimeout(() => { interval = setInterval(() => onHold?.(++count), speed); }, delay);
  };

  const up = event => { if (event.pointerId === id) stop(); };

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
}

export       { holdable };
export default holdable;
