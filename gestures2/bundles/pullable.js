// @aufbau/gestures2/bundles/pullable.js
// pull to refresh on a scroll container: at the top, pulling down draws the
// content after the pointer with resistance. released past `threshold` it
// holds there while `onRefresh` runs (a promise is awaited), then goes back.
// `onPull` reports distance, progress (0 to 1 at the threshold) and whether it
// is refreshing, for an indicator.
//
// the browser's own pull to refresh and the scroll chaining are turned off on
// the container (overscroll-behavior-y: contain), and a pull that began at the
// top is not handed to the scroller.
//
// keyboard: none, a refresh button is the keyboard counterpart.
//
//   pullable(feed, { onRefresh: () => load(), onPull: ({ progress }) => spinner.style.rotate = progress * 360 + 'deg' });

import gestures  from './../index.js';
import { tween } from './motion.js';

function pullable (element, options = {}) {
  const {
    content    = element.firstElementChild,   // what moves with the pull
    maximum    = 1.75,                        // how far past the threshold, as a multiple of it
    onPull     = null,
    onRefresh  = null,
    resistance = 0.5,
    threshold  = 64,
  } = options;

  let pulling    = false;
  let refreshing = false;
  let distance   = 0;
  let motion     = null;
  let touchY     = 0;

  const previousOverscroll = element.style.overscrollBehaviorY;
  element.style.overscrollBehaviorY = 'contain';

  const atTop = () => element.scrollTop <= 0;

  function render () {
    content.style.translate = distance ? `0 ${distance}px` : '';
    onPull?.({ distance, progress: Math.min(1, distance / threshold), refreshing });
  }

  const animate = (to, done) => {
    motion?.stop();
    motion = tween({ x: 0, y: distance }, { x: 0, y: to }, { duration: 220, onDone: () => { motion = null; done?.(); }, onFrame: point => { distance = point.y; render(); } });
  };

  async function refresh () {
    if (refreshing) return;
    refreshing = true;
    animate(threshold);
    try { await onRefresh?.(); }
    finally { refreshing = false; animate(0); }
  }

  function release () {
    if (!pulling) return;
    pulling = false;
    if (distance >= threshold && onRefresh) refresh();
    else animate(0);
  }

  // a pull downward at the top must not become a scroll, otherwise the browser
  // takes the pointer and the session is cancelled
  const touchstart = event => { touchY = event.touches[0]?.clientY ?? 0; };
  const touchmove  = event => {
    const down = (event.touches[0]?.clientY ?? 0) > touchY;
    if ((pulling || (atTop() && down && !refreshing)) && event.cancelable) event.preventDefault();
  };
  element.addEventListener('touchstart', touchstart, { passive: true });
  element.addEventListener('touchmove',  touchmove,  { passive: false });

  const handle = gestures(element, {
    onPanCancel : () => { pulling = false; if (!refreshing) animate(0); },
    onPanEnd    : release,
    onPanMove   : gesture => {
      if (!pulling) return;
      distance = Math.min(threshold * maximum, Math.max(0, gesture.delta.y) * resistance);
      render();
    },
    onPanStart  : gesture => {
      pulling = !refreshing && atTop() && gesture.delta.y > 0;
      if (pulling) motion?.stop();
    },
    pan : { touchAction: 'pan-y' },
  });

  return {
    refresh,
    destroy () {
      motion?.stop();
      handle.destroy();
      element.removeEventListener('touchstart', touchstart);
      element.removeEventListener('touchmove',  touchmove);
      element.style.overscrollBehaviorY = previousOverscroll;
    },
  };
}

export { pullable };
export default pullable;
