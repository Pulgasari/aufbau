// @aufbau/gestures/recognizers/swipe.js
// a flick: judged on release, far enough and fast enough. it reads the same
// session as pan, the two coexist. a long press or an exclusive claim (edge
// swipe, double tap drag, secondary) rules it out.
//
// the direction is the one of the velocity at release, not of the whole delta:
// a drag to the left that ends in a flick to the right is a swipe to the right,
// which is what the hand meant. `distance` still has to pass the threshold, so
// a short twitch is no swipe.
//
// touch-action follows the directions that are listened to or recognized: only
// left/right leaves vertical scrolling to the browser, only up/down the
// horizontal one, `swipe` itself takes both.

import { NO_SELECT, exclusive } from './../shared.js';
import { directionOf }          from './../tracker.js';

function swipe ({ active, emit, options }) {
  const { minimumDistance = 30, minimumSpeed = 0.3, touchAction = null } = options;

  const horizontal = active.has('swipeLeft') || active.has('swipeRight');
  const vertical   = active.has('swipeUp')   || active.has('swipeDown');
  const generic    = active.has('swipe') || (!horizontal && !vertical);

  function end (session) {
    if (session.claims.has('longPress') || exclusive(session)) return;
    if (session.distance < minimumDistance || session.velocity.speed < minimumSpeed) return;
    const direction = directionOf(session.velocity.x, session.velocity.y);
    if (!direction) return;
    emit('swipe', session, { direction });
    emit('swipe' + direction[0].toUpperCase() + direction.slice(1), session, { direction });
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
