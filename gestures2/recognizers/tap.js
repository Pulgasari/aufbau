// @aufbau/gestures2/recognizers/tap.js
// tap and doubleTap. a tap is a session that did not travel past the tolerance,
// was released within maximumDuration and was not claimed by anything else.
// consecutive taps close in time and place count up; `count` is in the detail.
//
// with doubleTap active a single tap waits `interval` ms, so the two can be told
// apart. without it the tap fires at once.

import { toleranceFor } from './../shared.js';

function tap ({ active, emit, options }) {
  const { interval = 300, maximumDuration = 500, tolerance } = options;
  const waitsForDouble = active.has('doubleTap');

  let count   = 0;
  let last    = null;   // { x, y, time } of the previous tap
  let pending = null;   // the single tap held back while a second may follow

  const flush = () => { clearTimeout(pending?.timer); pending = null; };

  function end (session, event) {
    const allowed = toleranceFor(tolerance, session.input);
    if (session.claims.size || session.travel > allowed || session.duration > maximumDuration) { count = 0; return; }

    const time  = event.timeStamp;
    const close = last && time - last.time <= interval && Math.hypot(session.center.x - last.x, session.center.y - last.y) <= allowed * 3;
    count = close ? count + 1 : 1;
    last  = { time, x: session.center.x, y: session.center.y };

    if (count === 2 && waitsForDouble) {
      flush();
      emit('doubleTap', session, { count });
      return;
    }

    if (!waitsForDouble || count > 2) { emit('tap', session, { count }); return; }

    flush();
    const held = { count };
    pending = { timer: setTimeout(() => { pending = null; emit('tap', session, held); }, interval) };
  }

  return {
    end,
    destroy     : flush,
    touchAction : 'manipulation',   // no double tap zoom delay
  };
}

tap.gestures = ['tap', 'doubleTap'];

export { tap };
export default tap;
