// @aufbau/gestures2/bundles/sortable.js
// reorder the items of a list or grid by dragging them. on touch and pen an item
// is lifted by a long press first, so a plain drag still scrolls the list; the
// mouse drags at once. the item follows the pointer, the others make room with a
// short animation, the dom order changes while dragging, so what is seen is
// what the list is.
//
// the lifted item carries data-lifted, the dragged one data-dragging, the list
// data-sorting.
//
// keyboard, once an item has focus: alt + arrow moves it one place.
//
//   sortable(list, { onSort: ({ item, from, to, order }) => save(order) });

import gestures  from './../index.js';
import { tween } from './motion.js';

const FLIP = { duration: 150, easing: 'ease-out' };

function sortable (list, options = {}) {
  const {
    axis     = 'y',              // 'y', 'x' or null for a grid, only for touch-action
    handle   = null,             // a selector inside the item that starts the drag
    hold     = 350,              // ms of the long press on touch and pen
    items    = null,             // a selector for the items, the children by default
    keyboard = true,
    onEnd    = null,
    onSort   = null,
    onStart  = null,
  } = options;

  let item     = null;   // the dragged item
  let grab     = null;   // where it was grabbed, relative to its box
  let shift    = { x: 0, y: 0 };
  let from     = -1;
  let layout   = null;   // [item, rect] of the others, their positions without animation
  let motion   = null;
  let restore  = null;

  const itemsOf = () => [...list.children].filter(child => !items || child.matches(items));

  const itemOf = node => {
    while (node && node.parentElement !== list) node = node.parentElement;
    return node && (!items || node.matches(items)) ? node : null;
  };

  // :::::: POSITION

  // the item's box without its drag translation
  const baseOf = () => { const rect = item.getBoundingClientRect(); return { left: rect.left - shift.x, top: rect.top - shift.y }; };

  function follow (point) {
    const base = baseOf();
    shift = { x: point.x - grab.x - base.left, y: point.y - grab.y - base.top };
    item.style.translate = `${shift.x}px ${shift.y}px`;
  }

  // the others' boxes, where they are going rather than where an animation has them
  const measure = () => { layout = itemsOf().filter(other => other !== item).map(other => [other, other.getBoundingClientRect()]); };

  const hit = point => layout.find(([, rect]) => point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom)?.[0] ?? null;

  // moves `moving` next to `target` and lets the others slide into place. the
  // positions they end up at are taken before any animation starts, they are
  // the layout the hit test runs against
  function reorder (moving, target) {
    const before = new Map(itemsOf().map(other => [other, other.getBoundingClientRect()]));
    const order  = itemsOf();
    if (order.indexOf(target) > order.indexOf(moving)) target.after(moving); else target.before(moving);

    const after = itemsOf().filter(other => other !== item).map(other => [other, other.getBoundingClientRect()]);
    for (const [other, now] of after) {
      const was = before.get(other);
      const dx  = was.left - now.left;
      const dy  = was.top  - now.top;
      if (dx || dy) other.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], FLIP);
    }
    return after;
  }

  // :::::: DRAG

  function start (gesture) {
    const candidate = itemOf(gesture.target);
    if (!candidate || (handle && !gesture.target.closest(handle))) return;

    motion?.stop();
    item  = candidate;
    from  = itemsOf().indexOf(item);
    shift = { x: 0, y: 0 };
    const rect = item.getBoundingClientRect();
    grab  = { x: gesture.start.x - rect.left, y: gesture.start.y - rect.top };

    restore = { position: item.style.position, zIndex: item.style.zIndex };
    if (getComputedStyle(item).position === 'static') item.style.position = 'relative';
    item.style.zIndex        = '1';
    item.dataset.dragging    = '';
    list.dataset.sorting     = '';

    measure();
    follow(gesture.center);
    onStart?.({ from, item });
  }

  function move (gesture) {
    if (!item) return;
    follow(gesture.center);
    const target = hit(gesture.center);
    if (!target) return;
    layout = reorder(item, target);
    follow(gesture.center);   // the item moved in the dom, its translation follows
  }

  function finish () {
    if (!item) return;
    const done  = item;
    const to    = itemsOf().indexOf(done);
    const reset = restore;
    item = null;
    delete list.dataset.sorting;
    delete done.dataset.dragging;
    delete done.dataset.lifted;

    motion = tween(shift, { x: 0, y: 0 }, {
      duration : 180,
      onFrame  : point => { done.style.translate = `${point.x}px ${point.y}px`; },
      onDone   : () => {
        motion = null;
        done.style.translate = '';
        Object.assign(done.style, reset);
        if (to !== from) onSort?.({ from, item: done, order: itemsOf(), to });
        onEnd?.({ from, item: done, to });
      },
    });
  }

  // a drag after a long press has not scrolled yet: the scroll is refused while it lasts
  const holdScroll = event => { if (item && event.cancelable) event.preventDefault(); };
  list.addEventListener('touchmove', holdScroll, { passive: false });

  const handleGestures = gestures(list, {
    longPress     : { duration: hold },
    onLongPress   : gesture => { const lifted = itemOf(gesture.target); if (lifted) lifted.dataset.lifted = ''; },
    onPanCancel   : finish,
    onPanEnd      : finish,
    onPanMove     : move,
    onPanStart    : start,
    onPressEnd    : gesture => { const lifted = itemOf(gesture.target); if (lifted && lifted !== item) delete lifted.dataset.lifted; },
    pan           : { after: { pen: 'longPress', touch: 'longPress' }, touchAction: axis === 'y' ? 'pan-y' : axis === 'x' ? 'pan-x' : 'none' },
  });

  // :::::: KEYBOARD

  const STEP = { ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1 };

  function keydown (event) {
    const step   = STEP[event.key];
    const moving = itemOf(event.target);
    if (!step || !event.altKey || !moving || item) return;
    event.preventDefault();

    const order  = itemsOf();
    const index  = order.indexOf(moving);
    const target = order[index + step];
    if (!target) return;

    reorder(moving, target);
    moving.focus();
    onSort?.({ from: index, item: moving, order: itemsOf(), to: index + step });
  }

  if (keyboard) {
    for (const child of itemsOf()) if (!child.hasAttribute('tabindex')) child.tabIndex = 0;
    list.addEventListener('keydown', keydown);
  }

  return {
    order : itemsOf,
    destroy () {
      motion?.stop();
      handleGestures.destroy();
      list.removeEventListener('touchmove', holdScroll);
      list.removeEventListener('keydown', keydown);
    },
  };
}

export { sortable };
export default sortable;
