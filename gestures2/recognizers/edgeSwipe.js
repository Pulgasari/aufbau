// @aufbau/gestures2/recognizers/edgeSwipe.js
// a swipe that starts at an edge and moves away from it: the back gesture, a
// drawer pulled out. the first pointer has to go down within `size` px of one of
// the `edges`, of the element or of the viewport (`relativeTo: 'viewport'`).
// once it travels past the tolerance away from that edge it claims the session,
// pan and swipe step back.
//
// continuous like pan: edgeSwipeStart, edgeSwipeMove, edgeSwipeEnd and
// edgeSwipeCancel, with the `edge` and a `progress` from 0 to 1 across the
// element (or viewport) along the swipe.

import { toleranceFor } from './../shared.js';

const AWAY = {
  bottom : delta => -delta.y > Math.abs(delta.x),
  left   : delta =>  delta.x > Math.abs(delta.y),
  right  : delta => -delta.x > Math.abs(delta.y),
  top    : delta =>  delta.y > Math.abs(delta.x),
};

function edgeSwipe ({ element, emit, options }) {
  const { edges = ['left'], relativeTo = 'element', size = 24, tolerance } = options;

  let edge     = null;   // the edge the session started at
  let frame    = null;   // the box it is measured against
  let swiping  = false;

  const boxOf = () => relativeTo === 'viewport'
    ? { bottom: innerHeight, height: innerHeight, left: 0, right: innerWidth, top: 0, width: innerWidth }
    : element.getBoundingClientRect();

  const progressOf = session =>
      edge === 'left' || edge === 'right' ? Math.min(1, Math.abs(session.delta.x) / frame.width)
    :                                       Math.min(1, Math.abs(session.delta.y) / frame.height);

  const detail = session => ({ edge, progress: progressOf(session) });

  function start (session) {
    swiping = false;
    frame   = boxOf();
    const { x, y } = session.start;
    edge = edges.find(name =>
        name === 'left'   ? x - frame.left   <= size
      : name === 'right'  ? frame.right - x  <= size
      : name === 'top'    ? y - frame.top    <= size
      :                     frame.bottom - y <= size) ?? null;
  }

  function move (session) {
    if (!edge) return;
    if (!swiping) {
      if (session.pointers !== 1 || session.travel <= toleranceFor(tolerance, session.input)) return;
      if (!AWAY[edge](session.delta)) { edge = null; return; }   // along the edge or back: not an edge swipe
      swiping = true;
      session.claims.add('edgeSwipe');
      emit('edgeSwipeStart', session, detail(session));
    }
    emit('edgeSwipeMove', session, detail(session));
  }

  function finish (gesture, session) {
    if (swiping) emit(gesture, session, detail(session));
    swiping = false;
    edge    = null;
  }

  const horizontal = edges.some(name => name === 'left' || name === 'right');
  const vertical   = edges.some(name => name === 'top'  || name === 'bottom');

  return {
    start,
    move,
    end         : session => finish('edgeSwipeEnd', session),
    cancel      : session => finish('edgeSwipeCancel', session),
    touchAction : horizontal && vertical ? 'none' : horizontal ? 'pan-y' : 'pan-x',
  };
}

edgeSwipe.gestures = ['edgeSwipeCancel', 'edgeSwipeEnd', 'edgeSwipeMove', 'edgeSwipeStart'];
edgeSwipe.priority = 1;

export { edgeSwipe };
export default edgeSwipe;
