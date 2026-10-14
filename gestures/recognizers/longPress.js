// @aufbau/gestures/recognizers/longPress.js
// a session held still for `duration` ms. it claims the session, so a tap does
// not follow on release.
//
// on touch the platform may open its own menu for the same hold (android fires
// contextmenu). where secondary listens, the platform's meaning wins: a long
// press on touch and pen waits `grace` ms longer and steps back if a contextmenu
// claimed the session meanwhile, so the two never both fire. where secondary
// does not listen, the native menu is prevented while a long press listens.

import { NO_SELECT, claim, toleranceFor } from './../shared.js';

function longPress ({ active, element, emit, options }) {
  const { duration = 500, grace = 200, tolerance } = options;
  const deferring = active.has('secondary');
  let timer = null;

  const stop = () => { clearTimeout(timer); timer = null; };

  const fire = (session, began) => {
    timer = null;
    if (session.claims.size || session.pointers === 0 || session.phase === 'cancel') return;
    if (!claim(session, 'longPress')) return;
    emit('longPress', session, { duration: performance.now() - began });
  };

  // the timer fires between pointer events, so the session's duration is the one of
  // the last event. the held time is measured here
  function start (session) {
    stop();
    const began = performance.now() - session.duration;
    const wait  = deferring && session.input !== 'mouse' ? duration + grace : duration;
    timer = setTimeout(() => fire(session, began), wait);
  }

  // moving away or a second pointer (a pinch beginning) is no long press
  function move (session) {
    if (timer && (session.travel > toleranceFor(tolerance, session.input) || session.pointers > 1)) stop();
  }

  const preventNativeMenu = event => { if (event.pointerType && event.pointerType !== 'mouse') event.preventDefault(); };
  if (!deferring) element.addEventListener('contextmenu', preventNativeMenu);

  return {
    start,
    move,
    end         : stop,
    cancel      : stop,
    destroy     : () => { stop(); element.removeEventListener('contextmenu', preventNativeMenu); },
    style       : NO_SELECT,
    touchAction : 'manipulation',
  };
}

longPress.gestures = ['longPress'];

export { longPress };
export default longPress;
