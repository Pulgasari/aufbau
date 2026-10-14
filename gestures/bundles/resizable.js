// @aufbau/gestures/bundles/resizable.js
// resize an element by its edges and corners: a pointer that goes down within
// `size` px of one of the `edges` drags that edge, anywhere else nothing is
// claimed, so content inside still scrolls, selects and clicks. kept within
// minimum and maximum, optionally to an aspect ratio and a grid. the size is
// written as width and height (minus padding and border for content-box); the
// left and top edges also shift the element with `translate` so the opposite
// edge stays put.
//
// the resized element carries data-resizing with the edge, the cursor shows
// the edge under a mouse or pen.
//
// keyboard, once it has focus: shift + arrows change width and height by `step`.
//
//   resizable(panel, { edges: ['right', 'bottom', 'bottom-right'], minimumWidth: 200, onChange: ({ width }) => … });

import gestures  from './../index.js';
import { frame } from './motion.js';

const CURSORS = {
  'bottom'       : 'ns-resize',
  'bottom-left'  : 'nesw-resize',
  'bottom-right' : 'nwse-resize',
  'left'         : 'ew-resize',
  'right'        : 'ew-resize',
  'top'          : 'ns-resize',
  'top-left'     : 'nwse-resize',
  'top-right'    : 'nesw-resize',
};

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

const translationOf = node => {
  const [x = 0, y = 0] = (node.style.translate || '').split(/\s+/).map(part => parseFloat(part) || 0);
  return { x, y };
};

function resizable (element, options = {}) {
  const {
    aspectRatio   = null,                                // a number, true for the current one, null for free
    edges         = ['right', 'bottom', 'bottom-right'],
    grid          = null,                                // a step in px the size snaps to
    keyboard      = true,
    maximumHeight = Infinity,
    maximumWidth  = Infinity,
    minimumHeight = 24,
    minimumWidth  = 24,
    onChange      = null,
    onEnd         = null,
    onStart       = null,
    size          = 8,                                   // px of the grip zone along an edge
    step          = 10,
  } = options;

  let zone    = null;   // the edge being dragged
  let start   = null;   // { width, height } of the border box when the drag began
  let offset  = null;   // the translation when the drag began
  let current = null;   // { width, height, x, y }
  let extra   = null;   // padding and border, subtracted for content-box
  let ratio   = null;
  let touched = null;   // the zone a touch went down on, decided before its first move

  const previousCursor = element.style.cursor;

  // which edge or corner a point is on, inside the element's box
  function zoneAt (point) {
    const box = element.getBoundingClientRect();
    if (point.x < box.left || point.x > box.right || point.y < box.top || point.y > box.bottom) return null;
    const vertical   = point.y - box.top  <= size ? 'top'  : box.bottom - point.y <= size ? 'bottom' : '';
    const horizontal = point.x - box.left <= size ? 'left' : box.right  - point.x <= size ? 'right'  : '';
    const name = vertical && horizontal ? `${vertical}-${horizontal}` : vertical || horizontal;
    return name && edges.includes(name) ? name : null;
  }

  function measure () {
    const box   = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const sum   = (...names) => names.reduce((total, name) => total + (parseFloat(style[name]) || 0), 0);
    extra = style.boxSizing === 'border-box' ? { x: 0, y: 0 } : {
      x: sum('paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'),
      y: sum('paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'),
    };
    start  = { height: box.height, width: box.width };
    offset = translationOf(element);
    ratio  = aspectRatio === true ? box.width / box.height : aspectRatio;
  }

  // the size for a movement of the dragged edge by dx, dy
  function sizeFor (dx, dy) {
    let width  = start.width  + (zone.includes('right')  ? dx : zone.includes('left') ? -dx : 0);
    let height = start.height + (zone.includes('bottom') ? dy : zone.includes('top')  ? -dy : 0);

    if (grid) { width = Math.round(width / grid) * grid; height = Math.round(height / grid) * grid; }
    width  = clamp(width,  minimumWidth,  maximumWidth);
    height = clamp(height, minimumHeight, maximumHeight);

    if (ratio) {
      const vertical = zone === 'top' || zone === 'bottom';
      if (vertical) width = height * ratio; else height = width / ratio;
    }

    return {
      height,
      width,
      x : offset.x + (zone.includes('left') ? start.width  - width  : 0),
      y : offset.y + (zone.includes('top')  ? start.height - height : 0),
    };
  }

  const shifts = () => zone.includes('left') || zone.includes('top');

  function render () {
    element.style.width  = `${current.width  - extra.x}px`;
    element.style.height = `${current.height - extra.y}px`;
    if (shifts()) element.style.translate = `${current.x}px ${current.y}px`;
  }

  const painter = frame(render);
  const report  = (callback, more = {}) => callback?.({ edge: zone, element, height: current.height, width: current.width, ...more });

  // :::::: GESTURES

  const handle = gestures(element, {
    onPanCancel : () => finish(),
    onPanEnd    : () => finish(),
    onPanMove   : gesture => {
      if (!zone) return;
      current = sizeFor(gesture.delta.x, gesture.delta.y);
      painter.schedule();
      report(onChange);
    },
    onPanStart  : gesture => {
      zone = zoneAt(gesture.start);
      if (!zone) return;
      measure();
      current = { ...start, ...offset };
      element.dataset.resizing = zone;
      report(onStart);
    },
    pan : { touchAction: 'manipulation' },
  });

  // only a pointer that went down on an edge starts a drag, anything else stays
  // with the content: decided once per session, before the pan could claim it
  handle.enable('pan', gesture => !!zoneAt(gesture.start));

  function finish () {
    if (!zone) return;
    painter.flush();
    delete element.dataset.resizing;
    report(onEnd);
    zone = null;
  }

  // a touch on an edge must not scroll, the browser would take the pointer
  const touchstart = event => { const touch = event.touches[0]; touched = touch ? zoneAt({ x: touch.clientX, y: touch.clientY }) : null; };
  const touchmove  = event => { if (touched && event.cancelable) event.preventDefault(); };
  element.addEventListener('touchstart', touchstart, { passive: true });
  element.addEventListener('touchmove',  touchmove,  { passive: false });

  // the cursor follows the edge under a mouse or pen that is not pressed
  const hover = event => {
    if (event.pointerType === 'touch' || event.buttons) return;
    const edge = zoneAt({ x: event.clientX, y: event.clientY });
    element.style.cursor = edge ? CURSORS[edge] : previousCursor;
  };
  const leave = () => { if (!zone) element.style.cursor = previousCursor; };
  element.addEventListener('pointermove',  hover);
  element.addEventListener('pointerleave', leave);

  // :::::: KEYBOARD

  const KEYS = { ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1] };

  function keydown (event) {
    const direction = KEYS[event.key];
    if (!direction || !event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    zone = direction[0] ? 'right' : 'bottom';   // one edge per key, so an aspect ratio follows the right axis
    measure();
    current = sizeFor(direction[0] * step, direction[1] * step);
    render();
    report(onChange);
    zone = null;
  }

  if (keyboard) {
    if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
    element.addEventListener('keydown', keydown);
  }

  return {
    get () { const box = element.getBoundingClientRect(); return { height: box.height, width: box.width }; },
    set (next) {
      zone = 'bottom-right';
      measure();
      current = sizeFor((next.width ?? start.width) - start.width, (next.height ?? start.height) - start.height);
      render();
      zone = null;
    },
    destroy () {
      painter.cancel();
      handle.destroy();
      element.removeEventListener('touchstart',   touchstart);
      element.removeEventListener('touchmove',    touchmove);
      element.removeEventListener('pointermove',  hover);
      element.removeEventListener('pointerleave', leave);
      element.removeEventListener('keydown',      keydown);
      element.style.cursor = previousCursor;
    },
  };
}

export { resizable };
export default resizable;
