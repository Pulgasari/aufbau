// @aufbau/gestures2/bundles/draggable.js
// an element that follows a pointer: moved with the css `translate` property,
// optionally locked to an axis, kept within bounds, gliding on after a flick,
// snapping to a grid or to points, and dropped onto targets.
//
// drop targets are found under the pointer by `drop` (a selector). while the
// element hovers one it carries data-drop-over, the dragged element carries
// data-dragging. with `revert: true` it returns to its start unless dropped.
//
// keyboard, once it has focus: arrows move by `step` (shift: five steps).
//
//   draggable(chip, { bounds: 'parent', drop: '.slot', onDrop: ({ target }) => … });
//
// named events would clash with the native drag and drop events, the bundle
// reports through callbacks: onStart, onMove, onEnd, onEnter, onLeave, onDrop.

import gestures        from './../index.js';
import { glide, tween } from './motion.js';

function draggable (element, options = {}) {
  const {
    axis     = null,    // 'x', 'y' or null
    bounds   = null,    // 'parent', an element, or null
    drop     = null,    // selector of drop targets
    grid     = null,    // a step in px, snapped to on release
    inertia  = true,
    keyboard = true,
    onDrop   = null,
    onEnd    = null,
    onEnter  = null,
    onLeave  = null,
    onMove   = null,
    onStart  = null,
    revert   = false,
    snap     = null,    // [{ x, y }, …], the nearest one on release
    step     = 10,
  } = options;

  let position = { x: 0, y: 0 };
  let start    = null;    // position when the drag began
  let range    = null;    // the allowed { minimumX, maximumX, minimumY, maximumY }
  let over     = null;    // the drop target under the pointer
  let motion   = null;

  const render = () => { element.style.translate = `${position.x}px ${position.y}px`; };
  const report = (callback, extra = {}) => callback?.({ element, position: { ...position }, target: over, ...extra });

  // :::::: LIMITS

  function measureRange () {
    const box = bounds === 'parent' ? element.parentElement : bounds;
    if (!box) return null;
    const outer = box.getBoundingClientRect();
    const inner = element.getBoundingClientRect();
    // the untranslated box, the range is what the translation may add to it
    const left = inner.left - position.x;
    const top  = inner.top  - position.y;
    return {
      maximumX : outer.right  - box.clientLeft - (left + inner.width),
      maximumY : outer.bottom - box.clientTop  - (top  + inner.height),
      minimumX : outer.left   + box.clientLeft - left,
      minimumY : outer.top    + box.clientTop  - top,
    };
  }

  const limit = point => {
    let { x, y } = point;
    if (axis === 'x') y = start?.y ?? position.y;
    if (axis === 'y') x = start?.x ?? position.x;
    if (range) {
      x = Math.min(range.maximumX, Math.max(range.minimumX, x));
      y = Math.min(range.maximumY, Math.max(range.minimumY, y));
    }
    return { x, y };
  };

  const settle = point => {
    let next = { ...point };
    if (grid) next = { x: Math.round(next.x / grid) * grid, y: Math.round(next.y / grid) * grid };
    if (snap?.length) next = snap.reduce((best, candidate) => Math.hypot(candidate.x - point.x, candidate.y - point.y) < Math.hypot(best.x - point.x, best.y - point.y) ? candidate : best);
    return limit(next);
  };

  const moveTo = (to, done) => {
    motion?.stop();
    motion = tween(position, to, { onDone: () => { motion = null; done?.(); }, onFrame: point => { position = point; render(); } });
  };

  // :::::: DROP TARGETS

  function findTarget (point) {
    if (!drop) return null;
    for (const candidate of document.elementsFromPoint(point.x, point.y)) {
      if (candidate === element || element.contains(candidate)) continue;
      const target = candidate.closest(drop);
      if (target && target !== element && !element.contains(target)) return target;
    }
    return null;
  }

  function hover (point) {
    const target = findTarget(point);
    if (target === over) return;
    if (over) { delete over.dataset.dropOver; report(onLeave); }
    over = target;
    if (over) { over.dataset.dropOver = ''; report(onEnter); }
  }

  // :::::: GESTURES

  const handle = gestures(element, {
    onPanCancel : () => finish(false),
    onPanEnd    : gesture => finish(true, gesture),
    onPanMove   : gesture => {
      position = limit({ x: start.x + gesture.delta.x, y: start.y + gesture.delta.y });
      render();
      hover(gesture.center);
      report(onMove);
    },
    onPanStart  : () => {
      motion?.stop();
      start = { ...position };
      range = measureRange();
      element.dataset.dragging = '';
      report(onStart);
    },
    pan : { axis },
  });

  function finish (released, gesture) {
    delete element.dataset.dragging;
    const target = over;
    if (over) { delete over.dataset.dropOver; over = null; }

    if (released && target) {
      report(onDrop, { target });
      report(onEnd, { dropped: true, target });
      return;
    }

    if (revert || !released) { moveTo(start, () => report(onEnd, { dropped: false })); return; }

    const done = () => moveTo(settle(position), () => report(onEnd, { dropped: false }));
    const { x, y } = gesture.velocity;
    if (!inertia || Math.hypot(x, y) < 0.1) { done(); return; }
    motion = glide(position, { x: axis === 'y' ? 0 : x, y: axis === 'x' ? 0 : y }, {
      limit   : limit,
      onDone  : () => { motion = null; done(); },
      onFrame : point => { position = point; render(); },
    });
  }

  // :::::: KEYBOARD

  const KEYS = { ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1] };

  function keydown (event) {
    const direction = KEYS[event.key];
    if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const distance = event.shiftKey ? step * 5 : step;
    start    = { ...position };
    range    = measureRange();
    position = limit({ x: position.x + direction[0] * distance, y: position.y + direction[1] * distance });
    render();
    report(onMove);
  }

  if (keyboard) {
    if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
    element.addEventListener('keydown', keydown);
  }

  return {
    get   : () => ({ ...position }),
    reset : () => moveTo({ x: 0, y: 0 }),
    set   : point => { motion?.stop(); position = { ...position, ...point }; render(); },
    destroy () {
      motion?.stop();
      handle.destroy();
      element.removeEventListener('keydown', keydown);
    },
  };
}

export { draggable };
export default draggable;
