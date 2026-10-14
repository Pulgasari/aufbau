// @aufbau/gestures/recognizers/tap.js
// tap, doubleTap and twoFingerTap. a tap is a session that did not travel past
// the tolerance, was released within maximumDuration and was not claimed by
// anything else. consecutive taps close in time and place count up; `count` is
// in the detail. a session that had two pointers down at once is a twoFingerTap
// instead, under the same rules.
//
// where doubleTap is listened to, a single tap waits: it fires only once
// `interval` ms passed without a second one, and a pair fires doubleTap alone.
// that is felt as lag, but a tap that also fires on the way to a double tap is
// the bigger surprise. `waitForDoubleTap` is a shorter wait in ms, or false for
// no wait at all (every tap fires at once, the second of a pair also fires
// doubleTap). where doubleTap is not listened to, nothing waits.

import { toleranceFor } from './../shared.js';

function tap ({ active, emit, options }) {
  const { interval = 300, maximumDuration = 500, tolerance, waitForDoubleTap = true } = options;
  const double    = active.has('doubleTap');
  const exclusive = double && waitForDoubleTap !== false;
  const wait      = typeof waitForDoubleTap === 'number' ? waitForDoubleTap : interval;

  let count   = 0;
  let last    = null;   // { x, y, time } of the previous tap
  let pending = null;   // the single tap held back while a second may follow

  const flush = () => { clearTimeout(pending); pending = null; };

  function end (session, event) {
    const allowed = toleranceFor(tolerance, session.input);
    if (session.claims.size || session.travel > allowed || session.duration > maximumDuration) { count = 0; return; }

    if (session.maximumPointers === 2) { count = 0; last = null; emit('twoFingerTap', session, { count: 1 }); return; }
    if (session.maximumPointers > 2) { count = 0; return; }

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

tap.gestures = ['doubleTap', 'tap', 'twoFingerTap'];

export { tap };
export default tap;
