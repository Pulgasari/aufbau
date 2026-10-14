// @aufbau/gestures/recognizers/doubleTapDrag.js
// tap, then press again at the same spot and drag: the one-handed zoom of maps
// and photo viewers. the second press is armed when it comes within `interval`
// ms of a tap and close to it; once it travels past the tolerance it claims the
// session before pan or swipe see it (priority 1) and reports start, every move,
// end and cancel. `start` and `delta` are those of the second press.
//
// touch-action can not depend on an earlier tap, so while a press is armed the
// touchmove's default is refused: otherwise the browser would scroll and cancel
// the session. a plain drag still scrolls.

import { claim, toleranceFor } from './../shared.js';

function doubleTapDrag ({ element, emit, options }) {
  const { interval = 300, maximumDuration = 500, tolerance } = options;

  let last     = null;    // { time, x, y } of the previous tap
  let armed    = false;
  let dragging = false;

  function start (session, event) {
    const allowed = toleranceFor(tolerance, session.input);
    armed = !!last && event.timeStamp - last.time <= interval && Math.hypot(session.start.x - last.x, session.start.y - last.y) <= allowed * 3;
    dragging = false;
  }

  function move (session, event) {
    if (dragging) {
      if (session.pointers !== 1) { finish('doubleTapDragEnd', session); return; }
      emit('doubleTapDragMove', session);
      return;
    }
    if (!armed || event?.type !== 'pointermove' || session.pointers !== 1) return;
    if (session.travel <= toleranceFor(tolerance, session.input)) return;
    armed = false;
    if (!claim(session, 'doubleTapDrag')) return;
    dragging = true;
    emit('doubleTapDragStart', session);
    emit('doubleTapDragMove',  session);
  }

  function finish (gesture, session) {
    if (dragging) emit(gesture, session);
    dragging = armed = false;
    last = null;
  }

  // a session that would count as a tap arms the next press
  function end (session, event) {
    if (dragging) { finish('doubleTapDragEnd', session); return; }
    const tapped = !session.claims.size && session.maximumPointers === 1 && session.duration <= maximumDuration && session.travel <= toleranceFor(tolerance, session.input);
    last  = tapped && !armed ? { time: event.timeStamp, x: session.center.x, y: session.center.y } : null;
    armed = false;
  }

  const holdScroll = event => { if ((armed || dragging) && event.cancelable) event.preventDefault(); };
  element.addEventListener('touchmove', holdScroll, { passive: false });

  return {
    start,
    move,
    end,
    cancel      : session => finish('doubleTapDragCancel', session),
    destroy     : () => { dragging = armed = false; last = null; element.removeEventListener('touchmove', holdScroll); },
    touchAction : 'manipulation',
  };
}

doubleTapDrag.gestures = ['doubleTapDragCancel', 'doubleTapDragEnd', 'doubleTapDragMove', 'doubleTapDragStart'];
doubleTapDrag.priority = 1;

export { doubleTapDrag };
export default doubleTapDrag;
