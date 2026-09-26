// @aufbau/gestures2/recognizers/wheel.js
// the wheel (or a trackpad scrolled with two fingers) as a continuous gesture:
// wheelStart, wheelMove for every wheel event, wheelEnd after a pause. named so
// it cannot be mistaken for the native wheel event. `movement` is the event's
// delta in pixels, `delta` the sum since wheelStart.
//
// the page does not scroll while the wheel is taken, `nativeScroll: true` lets it.
// `modifier: 'alt' | 'control' | 'meta' | 'shift'` only takes the wheel while it is
// held. ctrl + wheel is a trackpad pinch where pinch listens, it is left to it.

import { IDLE, inputSession, modifiersOf, normalizeWheel } from './../shared.js';

function wheel ({ active, element, emit, options }) {
  const { modifier = null, nativeScroll = false } = options;
  const pinching = active.has('pinchStart') || active.has('pinchMove') || active.has('pinchEnd') || active.has('pinch');

  let session = null;
  let idle    = null;

  function end () {
    clearTimeout(idle);
    if (!session) return;
    session.phase = 'end';
    const ended = session;
    session = null;
    emit('wheelEnd', ended);
  }

  function listener (event) {
    if (event.ctrlKey && pinching) return;
    if (modifier && !modifiersOf(event)[modifier]) return;
    if (!nativeScroll) event.preventDefault();

    const movement = normalizeWheel(event);
    const starting = !session;
    if (starting) session = inputSession(element, event, 'wheel');

    session.center    = { x: event.clientX, y: event.clientY };
    session.delta     = { x: session.delta.x + movement.x, y: session.delta.y + movement.y };
    session.distance  = Math.hypot(session.delta.x, session.delta.y);
    session.duration  = event.timeStamp - session.startTime;
    session.modifiers = modifiersOf(event);
    session.movement  = movement;
    session.time      = event.timeStamp;
    session.sourceEvent = event;
    session.direction = Math.abs(movement.x) >= Math.abs(movement.y) ? (movement.x > 0 ? 'right' : 'left') : (movement.y > 0 ? 'down' : 'up');

    if (starting) emit('wheelStart', session);
    session.phase = 'move';
    emit('wheelMove', session);

    clearTimeout(idle);
    idle = setTimeout(end, IDLE);
  }

  element.addEventListener('wheel', listener, { passive: false });

  return {
    destroy: () => { clearTimeout(idle); session = null; element.removeEventListener('wheel', listener); },
  };
}

wheel.gestures = ['wheelEnd', 'wheelMove', 'wheelStart'];

export { wheel };
export default wheel;
