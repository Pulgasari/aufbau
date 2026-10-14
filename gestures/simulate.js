// @aufbau/gestures/simulate
// @ts-self-types="./simulate.d.ts"
// synthetic pointer events along realistic paths: replays a gesture on an
// element to try recognizers, thresholds and bundles without a device, e.g.
// from a playground button. the events are dispatched on the element (or on
// `target` inside it) and bubble to window, where the tracker follows them.
// the browser's own scrolling, zooming and touch-action do not react to
// synthetic events, so this shows what the recognizers do, not what the
// platform would add.
//
//   import simulate from '@aufbau/gestures/simulate';
//   await simulate.swipe(list, { direction: 'left' });
//   await simulate.pinch(image, { scale: 2 });

let nextId = 1000;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const ease = t => 0.5 - Math.cos(t * Math.PI) / 2;

const centerOf = node => { const box = node.getBoundingClientRect(); return { x: box.left + box.width / 2, y: box.top + box.height / 2 }; };

const OFFSETS = { down: [0, 1], left: [-1, 0], right: [1, 0], up: [0, -1] };

function fire (node, type, pointer, point) {
  const up = type === 'pointerup';
  node.dispatchEvent(new PointerEvent(type, {
    bubbles     : true,
    button      : type === 'pointermove' ? -1 : 0,
    buttons     : up ? 0 : 1,
    cancelable  : true,
    clientX     : point.x,
    clientY     : point.y,
    composed    : true,
    height      : 20,
    isPrimary   : pointer.primary,
    pointerId   : pointer.id,
    pointerType : pointer.type,
    pressure    : up ? 0 : 0.5,
    width       : 20,
  }));
}

// pointers along their paths at the same time: each path maps t from 0 to 1 to
// a point. `hold` waits after the pointers went down, before they move
async function play (element, paths, { duration = 300, hold = 0, input = 'touch', target = element } = {}) {
  const steps    = Math.max(2, Math.round(duration / 16));
  const pointers = paths.map((path, index) => ({ id: input === 'mouse' ? 1 : nextId++, path, primary: index === 0, type: input }));

  for (const pointer of pointers) fire(target, 'pointerdown', pointer, pointer.path(0));
  if (hold) await wait(hold);
  for (let step = 1; step <= steps; step++) {
    await wait(duration / steps);
    for (const pointer of pointers) fire(target, 'pointermove', pointer, pointer.path(step / steps));
  }
  for (const pointer of [...pointers].reverse()) fire(target, 'pointerup', pointer, pointer.path(1));
}

const still = point => () => point;

// :::::: GESTURES

async function tap (element, { at, count = 1, input = 'touch', interval = 120, target = element } = {}) {
  const point = at ?? centerOf(target);
  for (let index = 0; index < count; index++) {
    if (index) await wait(interval);
    await play(element, [still(point)], { duration: 40, input, target });
  }
}

const doubleTap = (element, options = {}) => tap(element, { ...options, count: 2 });

function longPress (element, { at, duration = 700, input = 'touch', target = element } = {}) {
  return play(element, [still(at ?? centerOf(target))], { duration: 40, hold: duration, input, target });
}

// constant speed, so the velocity at release is the one of the whole swipe
function swipe (element, { at, direction = 'left', distance = 160, duration = 120, input = 'touch', target = element } = {}) {
  const from = at ?? centerOf(target);
  const [dx, dy] = OFFSETS[direction];
  return play(element, [t => ({ x: from.x + dx * distance * t, y: from.y + dy * distance * t })], { duration, input, target });
}

function pan (element, { at, dx = 120, dy = 0, duration = 400, input = 'touch', target = element } = {}) {
  const from = at ?? centerOf(target);
  return play(element, [t => ({ x: from.x + dx * ease(t), y: from.y + dy * ease(t) })], { duration, input, target });
}

// two fingers on a horizontal line through the center, spreading from `spread` to spread * scale
function pinch (element, { at, duration = 400, scale = 2, spread = 60, target = element } = {}) {
  const center = at ?? centerOf(target);
  const radius = t => spread + spread * (scale - 1) * ease(t);
  return play(element, [
    t => ({ x: center.x - radius(t), y: center.y }),
    t => ({ x: center.x + radius(t), y: center.y }),
  ], { duration, target });
}

function rotate (element, { at, degrees = 90, duration = 400, radius = 60, target = element } = {}) {
  const center = at ?? centerOf(target);
  const angle  = t => degrees * ease(t) * Math.PI / 180;
  return play(element, [
    t => ({ x: center.x - Math.cos(angle(t)) * radius, y: center.y - Math.sin(angle(t)) * radius }),
    t => ({ x: center.x + Math.cos(angle(t)) * radius, y: center.y + Math.sin(angle(t)) * radius }),
  ], { duration, target });
}

function twoFingerTap (element, { at, spread = 30, target = element } = {}) {
  const center = at ?? centerOf(target);
  return play(element, [still({ x: center.x - spread, y: center.y }), still({ x: center.x + spread, y: center.y })], { duration: 40, target });
}

async function doubleTapDrag (element, { at, dy = 120, duration = 400, target = element } = {}) {
  const from = at ?? centerOf(target);
  await tap(element, { at: from, target });
  await wait(100);
  await play(element, [t => ({ x: from.x, y: from.y + dy * ease(t) })], { duration, target });
}

// from just inside an edge of the element, away from it
function edgeSwipe (element, { distance = 200, duration = 300, edge = 'left', inset = 8, target = element } = {}) {
  const box   = element.getBoundingClientRect();
  const AWAY  = { bottom: 'up', left: 'right', right: 'left', top: 'down' };
  const START = {
    bottom : { x: box.left + box.width / 2, y: box.bottom - inset },
    left   : { x: box.left + inset,          y: box.top + box.height / 2 },
    right  : { x: box.right - inset,         y: box.top + box.height / 2 },
    top    : { x: box.left + box.width / 2, y: box.top + inset },
  };
  const [dx, dy] = OFFSETS[AWAY[edge]];
  const from     = START[edge];
  return play(element, [t => ({ x: from.x + dx * distance * ease(t), y: from.y + dy * distance * ease(t) })], { duration, target });
}

const simulate = { doubleTap, doubleTapDrag, edgeSwipe, longPress, pan, pinch, play, rotate, swipe, tap, twoFingerTap };

export { doubleTap, doubleTapDrag, edgeSwipe, longPress, pan, pinch, play, rotate, simulate, swipe, tap, twoFingerTap };
export default simulate;
