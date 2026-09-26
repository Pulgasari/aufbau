// @aufbau/gestures2/recognizers/swipe.js
// a flick: judged on release, far enough and fast enough. it reads the same
// session as pan, the two coexist. a claimed long press rules it out.
//
// touch-action follows the directions that are listened to: only left/right
// leaves vertical scrolling to the browser, only up/down the horizontal one.

import { NO_SELECT } from './../shared.js';

function swipe ({ emit, handled, options }) {
  const { minimumDistance = 30, minimumSpeed = 0.3, touchAction = null } = options;

  const horizontal = handled.has('swipeLeft') || handled.has('swipeRight');
  const vertical   = handled.has('swipeUp')   || handled.has('swipeDown');
  const generic    = handled.has('swipe') || (!horizontal && !vertical);   // enabled through `recognize` only counts as generic

  function end (session) {
    if (session.claims.has('longPress')) return;
    if (session.distance < minimumDistance || session.velocity.speed < minimumSpeed) return;
    emit('swipe', session);
    emit('swipe' + session.direction[0].toUpperCase() + session.direction.slice(1), session);
  }

  return {
    end,
    nativeDrag  : false,
    style       : NO_SELECT,
    touchAction : touchAction
      ?? (generic || (horizontal && vertical) ? 'none'
        : horizontal                            ? 'pan-y'
        :                                         'pan-x'),
  };
}

swipe.gestures = ['swipe', 'swipeDown', 'swipeLeft', 'swipeRight', 'swipeUp'];

export { swipe };
export default swipe;
