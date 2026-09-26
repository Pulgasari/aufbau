// @aufbau/gestures2/recognizers/tap.js
// tap and doubleTap. a tap is a session that did not travel past the tolerance,
// was released within maximumDuration and was not claimed by anything else.
// consecutive taps close in time and place count up; `count` is in the detail.
//
// every tap fires at once, the second one of a pair also fires doubleTap. with
// `waitForDoubleTap` a single tap is held back (true: 100 ms, or a number of ms)
// so that only one of the two fires. `interval` stays the window in which taps
// count up: a second tap after the wait but within the interval fires tap and
// doubleTap, the price of a short wait.

import { toleranceFor } from './../shared.js';

function tap ({ active, emit, options }) {
  const { interval = 300, maximumDuration = 500, tolerance, waitForDoubleTap = false } = options;
  const double    = active.has('doubleTap');
  const exclusive = double && waitForDoubleTap !== false;
  const wait      = typeof waitForDoubleTap === 'number' ? waitForDoubleTap : 100;

  let count   = 0;
  let last    = null;   // { x, y, time } of the previous tap
  let pending = null;   // the single tap held back while a second may follow

  const flush = () => { clearTimeout(pending); pending = null; };

  function end (session, event) {
    const allowed = toleranceFor(tolerance, session.input);
    if (session.claims.size || session.travel > allowed || session.duration > maximumDuration) { count = 0; return; }

    const time  = event.timeStamp;
    const close = last && time - last.time <= interval && Math.hypot(session.center.x - last.x, session.center.y - last.y) <= allowed * 3;
    count = close ? count + 1 : 1;
    last  = { time, x: session.center.x, y: session.center.y };

    if (!exclusive) {
      emit('tap', session, { count });
      if (double && count === 2) emit('doubleTap', session, { count });
      return;
    }

    flush();
    if (count === 2) { emit('doubleTap', session, { count }); return; }
    if (count > 2)   { emit('tap', session, { count }); return; }
    pending = setTimeout(() => { pending = null; emit('tap', session, { count: 1 }); }, wait);
  }

  return {
    end,
    destroy     : flush,
    touchAction : 'manipulation',   // no double tap zoom delay
  };
}

tap.gestures = ['doubleTap', 'tap'];

export { tap };
export default tap;
