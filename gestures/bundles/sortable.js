// @aufbau/gestures/bundles/sortable.js
// reorder the items of a list or grid by dragging them. on touch and pen an item
// is lifted by a long press first, so a plain drag still scrolls the list; the
// mouse drags at once. the item follows the pointer, the others make room with a
// short animation, the dom order changes while dragging, so what is seen is
// what the list is.
//
// lists with the same `group` take each other's items: drag one over another
// list of the group and it moves there, an empty list takes it as well. near
// the edges of the scroll container the container scrolls (`autoScroll`).
// the new position is announced to screen readers (`announce`).
//
// the lifted item carries data-lifted, the dragged one data-dragging, the list
// data-sorting.
//
// keyboard, once an item has focus: alt + arrow moves it one place.
//
//   sortable(list, { onSort: ({ item, from, to, order }) => save(order) });
//   sortable(todo, { group: 'board' }); sortable(done, { group: 'board' });

import gestures  from './../index.js';
import { tween } from './motion.js';

const FLIP = { duration: 150, easing: 'ease-out' };

const groups   = new Map;   // group name -> Set of members, one per sortable()
const dragging = new Set;   // items being dragged right now, by any sortable()

// :::::: ANNOUNCING
// one polite live region per document, visually hidden

let region = null;

function say (text) {
  if (!region?.isConnected) {
    region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    Object.assign(region.style, { clipPath: 'inset(50%)', height: '1px', overflow: 'hidden', position: 'fixed', whiteSpace: 'nowrap', width: '1px' });
    document.body.append(region);
  }
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = text; });
}

const POSITION = ({ length, to }) => `${to + 1} / ${length}`;

// :::::: SCROLLING

const scrolls = (node, axis) => {
  const style = getComputedStyle(node);
  const y = /auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
  const x = /auto|scroll/.test(style.overflowX) && node.scrollWidth  > node.clientWidth;
  return axis === 'x' ? x : axis === 'y' ? y : x || y;
};

function scrollerOf (node, axis) {
  for (let current = node; current && current !== document.body; current = current.parentElement) if (scrolls(current, axis)) return current;
  return document.scrollingElement;
}

const boxOf = node => node === document.scrollingElement
  ? { bottom: innerHeight, left: 0, right: innerWidth, top: 0 }
  : node.getBoundingClientRect();

// faster the deeper the pointer is in the edge zone, 0 outside of it
const pushOf = (position, low, high, edge, speed) =>
    position < low  + edge ? -speed * Math.min(1, (low + edge - position) / edge)
  : position > high - edge ?  speed * Math.min(1, (position - high + edge) / edge)
  :                           0;

// :::::: MAIN

function sortable (list, options = {}) {
  const {
    announce   = POSITION,         // (detail) => text, or false
    autoScroll = true,
    axis       = 'y',              // 'y', 'x' or null for a grid: touch-action and the scroll axis
    edge       = 48,               // px from the scroll container's edge where it starts scrolling
    group      = null,             // lists with the same group share their items
    handle     = null,             // a selector inside the item that starts the drag, shadow roots too
    hold       = 350,              // ms of the long press on touch and pen
    items      = null,             // a selector for the items, the children by default
    keyboard   = true,
    onEnd      = null,
    onSort     = null,
    onStart    = null,
    speed      = 16,               // px per frame at the very edge
  } = options;

  let item      = null;   // the dragged item
  let grab      = null;   // where it was grabbed, relative to its box
  let shift     = { x: 0, y: 0 };
  let base      = null;   // the item's box without its translation, measured on start and after every move in the dom
  let from      = -1;
  let source    = null;   // the member the item came from
  let layout    = null;   // [item, rect, member] of the others, where they are going rather than where an animation has them
  let pointer   = null;   // the last pointer position, for scrolling
  let scroller  = null;
  let scrolling = null;  // the frame of the scroll loop
  let motion    = null;
  let restore   = null;

  const itemsOf = () => [...list.children].filter(child => !items || child.matches(items));

  const itemOf = node => {
    while (node && node.parentElement !== list) node = node.parentElement;
    return node && (!items || node.matches(items)) ? node : null;
  };

  const member = { itemsOf, list };
  if (group) (groups.get(group) ?? groups.set(group, new Set).get(group)).add(member);

  const members  = () => group ? [...groups.get(group)] : [member];
  const memberOf = node => members().find(other => other.list === node.parentElement) ?? member;

  // the pointer went down on the handle: along the path from where it went down up to the item
  const onHandle = (gesture, candidate) => {
    const path = gesture.path ?? [gesture.target];
    return path.slice(0, path.indexOf(candidate) + 1).some(node => node.matches?.(handle));
  };

  // :::::: POSITION

  const rebase = () => { const rect = item.getBoundingClientRect(); base = { left: rect.left - shift.x, top: rect.top - shift.y }; };

  // no layout read here, only the write: base is kept up to date where the dom changes
  function follow (point) {
    shift = { x: point.x - grab.x - base.left, y: point.y - grab.y - base.top };
    item.style.translate = `${shift.x}px ${shift.y}px`;
  }

  // the others' boxes across the group, plus an empty list as a target of its own
  function measure () {
    layout = [];
    for (const other of members()) {
      const own = other.itemsOf().filter(candidate => candidate !== item);
      for (const candidate of own) layout.push([candidate, candidate.getBoundingClientRect(), other]);
      if (!own.length) layout.push([null, other.list.getBoundingClientRect(), other]);
    }
  }

  const hit = point => layout.find(([, rect]) => point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) ?? null;

  // moves `moving` next to `target` (or into an empty list) and lets the others
  // slide into place. the positions they end up at are taken before any
  // animation starts, they are the layout the hit test runs against
  function reorder (moving, target, into) {
    const everyone = members().flatMap(other => other.itemsOf());
    const before   = new Map(everyone.map(other => [other, other.getBoundingClientRect()]));

    if (!target) into.list.append(moving);
    else if (target.parentElement === moving.parentElement) {
      const order = [...moving.parentElement.children];
      if (order.indexOf(target) > order.indexOf(moving)) target.after(moving); else target.before(moving);
    }
    else target.before(moving);

    for (const other of members().flatMap(each => each.itemsOf())) {
      if (other === item || other === moving) continue;
      const was = before.get(other);
      if (!was) continue;
      const now = other.getBoundingClientRect();
      const dx  = was.left - now.left;
      const dy  = was.top  - now.top;
      if (dx || dy) other.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], FLIP);
    }
  }

  function place (point) {
    const found = hit(point);
    if (!found) return;
    const [target, , into] = found;
    reorder(item, target, into);
    measure();
    rebase();
    follow(point);   // the item moved in the dom, its translation follows
  }

  // :::::: AUTO SCROLL

  function scrollStep () {
    scrolling = null;
    if (!item || !pointer) return;
    const box = boxOf(scroller);
    const dx  = axis === 'y' ? 0 : pushOf(pointer.x, box.left, box.right,  edge, speed);
    const dy  = axis === 'x' ? 0 : pushOf(pointer.y, box.top,  box.bottom, edge, speed);
    if (!dx && !dy) return;
    scroller.scrollBy(dx, dy);
    measure();
    rebase();
    follow(pointer);
    place(pointer);
    scrolling = requestAnimationFrame(scrollStep);
  }

  // :::::: DRAG

  function start (gesture) {
    const candidate = itemOf(gesture.target);
    if (!candidate || (handle && !onHandle(gesture, candidate))) return;

    motion?.stop();
    item   = candidate;
    source = member;
    from   = itemsOf().indexOf(item);
    shift  = { x: 0, y: 0 };
    const rect = item.getBoundingClientRect();
    base  = { left: rect.left, top: rect.top };
    grab  = { x: gesture.start.x - rect.left, y: gesture.start.y - rect.top };
    scroller = autoScroll ? scrollerOf(list, axis) : null;

    restore = { position: item.style.position, zIndex: item.style.zIndex };
    if (getComputedStyle(item).position === 'static') item.style.position = 'relative';
    item.style.zIndex     = '1';
    item.dataset.dragging = '';
    list.dataset.sorting  = '';
    dragging.add(item);

    measure();
    follow(gesture.center);
    onStart?.({ from, item });
  }

  function move (gesture) {
    if (!item) return;
    pointer = gesture.center;
    follow(pointer);
    place(pointer);
    if (scroller && !scrolling) scrolling = requestAnimationFrame(scrollStep);
  }

  function finish () {
    if (!item) return;
    cancelAnimationFrame(scrolling);
    scrolling = null;

    const done   = item;
    const target = memberOf(done);
    const to     = target.itemsOf().indexOf(done);
    const reset  = restore;
    item = pointer = null;
    dragging.delete(done);
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
        const moved = to !== from || target !== source;
        const order = target.itemsOf();
        if (moved) {
          onSort?.({ from, item: done, list: target.list, order, source: source.list, to });
          if (announce) say(announce({ from, item: done, length: order.length, list: target.list, to }));
        }
        onEnd?.({ from, item: done, to });
      },
    });
  }

  // a drag after a long press has not scrolled yet: the scroll is refused while it
  // lasts, in every list of the group, because the item may be over any of them now
  const holdScroll = event => { if (dragging.size && event.cancelable) event.preventDefault(); };
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

    reorder(moving, target, member);
    moving.focus();
    const detail = { from: index, item: moving, length: order.length, list, order: itemsOf(), source: list, to: index + step };
    onSort?.(detail);
    if (announce) say(announce(detail));
  }

  if (keyboard) {
    for (const child of itemsOf()) if (!child.hasAttribute('tabindex')) child.tabIndex = 0;
    list.addEventListener('keydown', keydown);
  }

  return {
    order : itemsOf,
    destroy () {
      motion?.stop();
      cancelAnimationFrame(scrolling);
      if (item) dragging.delete(item);
      handleGestures.destroy();
      groups.get(group)?.delete(member);
      if (group && !groups.get(group)?.size) groups.delete(group);
      list.removeEventListener('touchmove', holdScroll);
      list.removeEventListener('keydown', keydown);
    },
  };
}

export { sortable };
export default sortable;
