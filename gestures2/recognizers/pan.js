// @aufbau/gestures2/recognizers/pan.js
// a drag. starts once the session travels past the tolerance with the given
// number of pointers, then claims the session (no tap follows). reports start,
// every move, end, and cancel when the browser takes the pointer.
//
// `axis: 'x'` or `'y'` leaves the other axis to native scrolling.

import { NO_SELECT, toleranceFor } from './../shared.js';

function pan ({ emit, options }) {
  const { axis = null, pointers = 1, tolerance } = options;
  let panning = false;

  function move (session) {
    if (!panning) {
      if (session.pointers !== pointers || session.claims.has('longPress')) return;
      if (session.travel <= toleranceFor(tolerance, session.input)) return;
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
    touchAction : axis === 'x' ? 'pan-y' : axis === 'y' ? 'pan-x' : 'none',
  };
}

pan.gestures = ['panCancel', 'panEnd', 'panMove', 'panStart'];

export { pan };
export default pan;
