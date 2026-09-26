// @aufbau/gestures2/recognizers/pinch.js
// two pointers moving apart or together. starts once the scale left 1 by more
// than `threshold`, reports every move, ends when fewer than two pointers are
// left. `scale` is relative to the moment the pair went down, `scaleChange` to
// the previous event, which is what an incremental transform multiplies by.
//
// a trackpad pinch arrives through trackpad.js with input 'trackpad',
// `trackpad: false` leaves it to the browser.

import { createTrackpad } from './../trackpad.js';

function pinch ({ element, emit, options }) {
  const { threshold = 0.05, trackpad = true, wheelIntensity } = options;
  let pinching = false;
  let previous = 1;

  const changeOf = session => { const change = session.scale / previous; previous = session.scale; return change; };

  // only Move carries a change: Start is neutral and followed at once by a Move
  // with everything since the session started, so a handler on Move alone
  // loses nothing that happened before the threshold was crossed
  function begin (session) {
    pinching = true;
    session.claims.add('pinch');
    emit('pinchStart', session, { scaleChange: 1 });
    emit('pinchMove',  session, { scaleChange: changeOf(session) });
  }

  function finish (gesture, session) {
    if (!pinching) return;
    pinching = false;
    const change = changeOf(session);
    if (change !== 1) emit('pinchMove', session, { scaleChange: change });
    emit(gesture, session, { scaleChange: 1 });
  }

  function move (session) {
    if (!pinching) {
      if (session.pointers >= 2 && Math.abs(session.scale - 1) >= threshold) begin(session);
      return;
    }
    if (session.pointers < 2) { finish('pinchEnd', session); return; }
    emit('pinchMove', session, { scaleChange: changeOf(session) });
  }

  const hooks = {
    start  : () => { previous = 1; },
    cancel : session => finish('pinchCancel', session),
    end    : session => finish('pinchEnd', session),
    move,
  };

  // a trackpad pinch has no threshold to cross, it is a pinch from the first event
  const pad = trackpad && createTrackpad(element, {
    end   : hooks.end,
    move  : session => { if (!pinching) begin(session); else emit('pinchMove', session, { scaleChange: changeOf(session) }); },
    start : () => { previous = 1; },
  }, { wheelIntensity });

  return {
    ...hooks,
    destroy     : () => { pinching = false; pad?.destroy(); },
    touchAction : 'none',
  };
}

pinch.gestures = ['pinchCancel', 'pinchEnd', 'pinchMove', 'pinchStart'];

export { pinch };
export default pinch;
