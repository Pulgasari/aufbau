// @aufbau/gestures2/trackpad.js
// a trackpad sends no pointers for a pinch or a rotation:
// - chrome and firefox report a pinch as wheel events with ctrlKey (the page
//   zoom convention, a mouse wheel with ctrl held arrives the same way)
// - safari reports gesturestart, gesturechange and gestureend with scale and
//   rotation, the only source of a trackpad rotation
// both become one session with input 'trackpad', so pinch and rotate treat them
// like two fingers. the page zoom they would trigger is prevented.

import { IDLE, inputSession, normalizeWheel } from './shared.js';

function createTrackpad (element, hooks, { wheel: withWheel = true, wheelIntensity = 0.01 } = {}) {
  let session = null;
  let idle    = null;

  const open = (event, source) => {
    session = inputSession(element, event, 'trackpad');
    session.maximumPointers = session.pointers = 2;
    session.source = source;
    hooks.start(session, event);
  };

  const update = (event, scale, rotation) => {
    session.center   = { x: event.clientX, y: event.clientY };
    session.duration = event.timeStamp - session.startTime;
    session.phase    = 'move';
    session.rotation = rotation;
    session.scale    = scale;
    hooks.move(session, event);
  };

  const close = event => {
    clearTimeout(idle);
    if (!session) return;
    session.phase    = 'end';
    session.pointers = 0;
    const ended = session;
    session = null;
    hooks.end(ended, event);
  };

  // :::::: WHEEL

  function wheel (event) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    if (session?.source === 'gesture') return;   // safari sends both, its gesture events are the richer source
    if (!session) open(event, 'wheel');
    update(event, session.scale * Math.exp(-normalizeWheel(event).y * wheelIntensity), 0);
    clearTimeout(idle);
    idle = setTimeout(() => close(event), IDLE);
  }

  // :::::: SAFARI

  function gesturestart  (event) { event.preventDefault(); close(event); open(event, 'gesture'); }
  function gesturechange (event) { event.preventDefault(); if (session) update(event, event.scale, event.rotation); }
  function gestureend    (event) { event.preventDefault(); close(event); }

  const listeners = withWheel ? { gesturechange, gestureend, gesturestart, wheel } : { gesturechange, gestureend, gesturestart };
  for (const [type, listener] of Object.entries(listeners)) element.addEventListener(type, listener, { passive: false });

  return {
    destroy () {
      clearTimeout(idle);
      session = null;
      for (const [type, listener] of Object.entries(listeners)) element.removeEventListener(type, listener);
    },
  };
}

export { createTrackpad };
export default createTrackpad;
