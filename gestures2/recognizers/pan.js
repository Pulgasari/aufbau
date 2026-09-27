// @aufbau/gestures2/recognizers/pan.js
// a drag. starts once the session travels past the tolerance with the given
// number of pointers, then claims the session (no tap follows). reports start,
// every move, end, and cancel when the browser takes the pointer.
//
// `axis: 'x'` or `'y'` leaves the other axis to native scrolling, `touchAction`
// sets it outright.
//
// `after: 'longPress'` starts the pan only once a long press claimed the
// session, then with the first movement: hold, then drag, while a plain drag
// still scrolls. per input as `{ touch: 'longPress', pen: 'longPress' }`, an
// input left out drags at once. without `after` a long press rules the pan out.

import { NO_SELECT, toleranceFor } from './../shared.js';

function pan ({ emit, options }) {
  const { after = null, axis = null, pointers = 1, tolerance, touchAction = null } = options;
  let panning = false;

  const waitsFor = input => typeof after === 'string' ? after : after?.[input] ?? null;

  // another finger count is another gesture: the pan ends, and starts anew with
  // the next actual movement, not with the finger change itself
  function move (session, event) {
    if (panning && session.pointers !== pointers) { panning = false; emit('panEnd', session); return; }

    if (!panning) {
      if (event.type !== 'pointermove') return;
      if (session.pointers !== pointers || session.claims.has('edgeSwipe')) return;

      const required = waitsFor(session.input);
      if (required) { if (!session.claims.has(required)) return; }
      else if ((after === null && session.claims.has('longPress')) || session.travel <= toleranceFor(tolerance, session.input)) return;
      panning = true;
      session.claims.add('pan');
      emit('panStart', session);
    }
    emit('panMove', session);
  }

  function end (session) {
    if (!panning) return;
    panning = false;
    emit('panEnd', session);
  }

  function cancel (session) {
    if (!panning) return;
    panning = false;
    emit('panCancel', session);
  }

  return {
    move,
    end,
    cancel,
    destroy     : () => { panning = false; },
    nativeDrag  : false,
    style       : NO_SELECT,
    touchAction : touchAction ?? (axis === 'x' ? 'pan-y' : axis === 'y' ? 'pan-x' : 'none'),
  };
}

pan.gestures = ['panCancel', 'panEnd', 'panMove', 'panStart'];

export { pan };
export default pan;
