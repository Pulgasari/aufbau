// @aufbau/gestures2/recognizers/press.js
// the contact itself, for immediate feedback: pressStart when the first pointer
// goes down, pressEnd when the last one comes up, pressCancel when the browser
// takes it. what :active is for the mouse, for every input. it decides nothing
// and claims nothing, the other recognizers run as usual.
//
// pressRepeat fires while the press is held still, after `delay` ms every
// `interval` ms, with a running `count`: the stepper button. pressStart is the
// first step, so a stepper counts one on contact and keeps counting while held.

import { toleranceFor } from './../shared.js';

function press ({ active, emit, options }) {
  const { delay = 400, interval = 100, tolerance } = options;
  const repeating = active.has('pressRepeat');

  let wait   = null;
  let repeat = null;
  let count  = 0;

  const stop = () => { clearTimeout(wait); clearInterval(repeat); wait = repeat = null; };

  function start (session) {
    emit('pressStart', session);
    if (!repeating) return;
    stop();
    count = 0;
    wait  = setTimeout(() => {
      repeat = setInterval(() => {
        if (session.claims.size || session.pointers === 0) { stop(); return; }
        emit('pressRepeat', session, { count: ++count });
      }, interval);
    }, delay);
  }

  function move (session) {
    if ((wait || repeat) && (session.travel > toleranceFor(tolerance, session.input) || session.pointers > 1)) stop();
  }

  return {
    start,
    move,
    end         : session => { stop(); emit('pressEnd', session); },
    cancel      : session => { stop(); emit('pressCancel', session); },
    destroy     : stop,
    touchAction : 'manipulation',
  };
}

press.gestures = ['pressCancel', 'pressEnd', 'pressRepeat', 'pressStart'];

export { press };
export default press;
