// @aufbau/gestures2/recognizers/rotate.js
// two pointers turning around each other. starts once they turned more than
// `threshold` degrees, reports every move, ends when fewer than two pointers are
// left. `rotation` is in degrees since the pair went down and passes ±180
// cleanly, `rotationChange` is the turn since the previous event.
//
// a trackpad rotation only exists in safari (gesture events), it arrives
// through trackpad.js with input 'trackpad'.

import { createTrackpad } from './../trackpad.js';

function rotate ({ element, emit, options }) {
  const { threshold = 10, trackpad = true } = options;
  let rotating = false;
  let previous = 0;

  const changeOf = session => { const change = session.rotation - previous; previous = session.rotation; return change; };

  // only Move carries a change: Start is neutral and followed at once by a Move
  // with everything since the session started, so a handler on Move alone
  // loses nothing that happened before the threshold was crossed
  function begin (session) {
    rotating = true;
    session.claims.add('rotate');
    emit('rotateStart', session, { rotationChange: 0 });
    emit('rotateMove',  session, { rotationChange: changeOf(session) });
  }

  function finish (gesture, session) {
    if (!rotating) return;
    rotating = false;
    const change = changeOf(session);
    if (change !== 0) emit('rotateMove', session, { rotationChange: change });
    emit(gesture, session, { rotationChange: 0 });
  }

  function move (session) {
    if (!rotating) {
      if (session.pointers >= 2 && Math.abs(session.rotation) >= threshold) begin(session);
      return;
    }
    if (session.pointers < 2) { finish('rotateEnd', session); return; }
    emit('rotateMove', session, { rotationChange: changeOf(session) });
  }

  const hooks = {
    start  : () => { previous = 0; },
    cancel : session => finish('rotateCancel', session),
    end    : session => finish('rotateEnd', session),
    move,
  };

  // the wheel carries no rotation, only safari's gesture events do
  const pad = trackpad && createTrackpad(element, {
    end   : hooks.end,
    move  : session => { if (session.source !== 'gesture') return; if (!rotating) begin(session); else emit('rotateMove', session, { rotationChange: changeOf(session) }); },
    start : () => { previous = 0; },
  }, { wheel: false });

  return {
    ...hooks,
    destroy     : () => { rotating = false; pad?.destroy(); },
    touchAction : 'none',
  };
}

rotate.gestures = ['rotateCancel', 'rotateEnd', 'rotateMove', 'rotateStart'];

export { rotate };
export default rotate;
