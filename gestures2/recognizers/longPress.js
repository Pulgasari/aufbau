// @aufbau/gestures2/recognizers/longPress.js
// a session held still for `duration` ms. it claims the session, so a tap does
// not follow on release.
//
// on touch the platform may open its own menu for the same hold (android fires
// contextmenu), which is prevented while a long press listens.

import { NO_SELECT, toleranceFor } from './../shared.js';

function longPress ({ element, emit, options }) {
  const { duration = 500, tolerance } = options;
  let timer = null;

  const stop = () => { clearTimeout(timer); timer = null; };

  // the timer fires between pointer events, so the session's duration is the one of
  // the last event. the held time is measured here
  function start (session) {
    stop();
    const began = performance.now() - session.duration;
    timer = setTimeout(() => {
      timer = null;
      if (session.claims.size || session.pointers === 0) return;
      session.claims.add('longPress');
      emit('longPress', session, { duration: performance.now() - began });
    }, duration);
  }

  function move (session) {
    if (timer && session.travel > toleranceFor(tolerance, session.input)) stop();
  }

  const preventNativeMenu = event => { if (event.pointerType && event.pointerType !== 'mouse') event.preventDefault(); };
  element.addEventListener('contextmenu', preventNativeMenu);

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
