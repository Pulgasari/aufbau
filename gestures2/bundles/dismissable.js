// @aufbau/gestures2/bundles/dismissable.js
// swipe away: the element follows the finger along one axis and fades, and on
// release it either leaves (far enough, or flicked fast enough) or snaps back.
// a direction that is not allowed follows with resistance.
//
// keyboard, once it has focus: delete or backspace dismisses it.
//
//   dismissable(toast, { directions: ['right'], onDismiss: ({ direction }) => toast.remove() });

import gestures  from './../index.js';
import { tween } from './motion.js';

function dismissable (element, options = {}) {
  const {
    axis       = 'x',
    directions = axis === 'x' ? ['left', 'right'] : ['up', 'down'],
    distance   = 0.4,    // share of the element's size that dismisses on release
    fade       = true,
    keyboard   = true,
    onDismiss  = null,
    onMove     = null,
    remove     = false,
    speed      = 0.5,    // px/ms that dismiss whatever the distance
  } = options;

  let offset = 0;
  let size   = 1;
  let motion = null;
  let gone   = false;

  const positive = axis === 'x' ? 'right' : 'down';
  const negative = axis === 'x' ? 'left'  : 'up';
  const directionOf = value => value >= 0 ? positive : negative;

  function render () {
    element.style.translate = axis === 'x' ? `${offset}px 0` : `0 ${offset}px`;
    if (fade) element.style.opacity = String(Math.max(0, 1 - Math.abs(offset) / size));
    onMove?.({ element, offset, progress: Math.min(1, Math.abs(offset) / (size * distance)) });
  }

  const animate = (to, done) => {
    motion?.stop();
    motion = tween({ x: offset, y: 0 }, { x: to, y: 0 }, { onDone: () => { motion = null; done?.(); }, onFrame: point => { offset = point.x; render(); } });
  };

  function dismiss (direction = directions[0]) {
    if (gone) return;
    gone = true;
    size = (axis === 'x' ? element.offsetWidth : element.offsetHeight) || 1;
    animate((direction === positive ? 1 : -1) * size * 1.2, () => {
      onDismiss?.({ direction, element });
      if (remove) element.remove();
    });
  }

  const back = () => animate(0);

  // :::::: GESTURES

  const handle = gestures(element, {
    onPanCancel : back,
    onPanEnd    : gesture => {
      const velocity = axis === 'x' ? gesture.velocity.x : gesture.velocity.y;
      const far      = Math.abs(offset) >= size * distance;
      const flicked  = Math.abs(velocity) >= speed && Math.sign(velocity) === Math.sign(offset);
      if ((far || flicked) && directions.includes(directionOf(offset))) dismiss(directionOf(offset));
      else back();
    },
    onPanMove   : gesture => {
      const raw = axis === 'x' ? gesture.delta.x : gesture.delta.y;
      offset = directions.includes(directionOf(raw)) ? raw : raw / 4;   // resistance where it may not go
      render();
    },
    onPanStart  : () => {
      if (gone) return;
      motion?.stop();
      size = (axis === 'x' ? element.offsetWidth : element.offsetHeight) || 1;
    },
    pan : { axis },
  });

  // :::::: KEYBOARD

  function keydown (event) {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    dismiss();
  }

  if (keyboard) {
    if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
    element.addEventListener('keydown', keydown);
  }

  return {
    dismiss,
    reset () { motion?.stop(); gone = false; offset = 0; render(); },
    destroy () {
      motion?.stop();
      handle.destroy();
      element.removeEventListener('keydown', keydown);
    },
  };
}

export { dismissable };
export default dismissable;
