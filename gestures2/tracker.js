// @aufbau/gestures2/tracker.js
// measures, decides nothing. one session per element, from the first pointer
// down to the last pointer up. the recognizers read the session through the
// hooks, see concept.md for its fields.
//
// hooks.move also runs when a pointer comes or goes, that is when a pinch can
// start or stop. `movement` is the center's change since the previous event.
//
// the pointer that went down on the element is followed through window-level
// listeners instead of pointer capture: capture also retargets the compatibility
// mouse events, which would swallow the clicks of buttons inside the element.

const VELOCITY_WINDOW = 100;   // ms of samples the velocity is averaged over

const DIRECTIONS = { down: 'down', left: 'left', right: 'right', up: 'up' };

const directionOf = (x, y) =>
    x === 0 && y === 0          ? null
  : Math.abs(x) >= Math.abs(y) ? (x > 0 ? DIRECTIONS.right : DIRECTIONS.left)
  :                              (y > 0 ? DIRECTIONS.down  : DIRECTIONS.up);

// signed shortest turn between two angles in degrees, in (-180, 180]
const turn = (from, to) => { const difference = (to - from) % 360; return difference > 180 ? difference - 360 : difference <= -180 ? difference + 360 : difference; };

const angleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
const distanceOf   = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

function createTracker (element, hooks) {
  const pointers = new Map;   // pointerId -> { x, y }
  let session    = null;
  let internal   = null;      // what only the tracker needs

  // :::::: MEASURING

  const centerOf = () => {
    let x = 0, y = 0;
    for (const point of pointers.values()) { x += point.x; y += point.y; }
    return { x: x / pointers.size, y: y / pointers.size };
  };

  const firstTwo = () => { const [a, b] = pointers.values(); return [a, b]; };

  // the reference for scale and rotation, taken whenever the second pointer arrives
  const rebasePair = () => {
    if (pointers.size < 2) { internal.pair = null; return; }
    const [a, b] = firstTwo();
    internal.pair = { angle: angleBetween(a, b), distance: distanceOf(a, b) || 1, rotation: session.rotation, scale: session.scale };
  };

  // a pointer coming or going moves the center, the start moves along so delta stays continuous
  const rebaseCenter = () => {
    const next = centerOf();
    session.start = { x: session.start.x + next.x - session.center.x, y: session.start.y + next.y - session.center.y };
    session.center = next;
    internal.samples.length = 0;
  };

  function measure (event) {
    const center = centerOf();
    const delta  = { x: center.x - session.start.x, y: center.y - session.start.y };
    const time   = event.timeStamp;

    session.buttons   = event.buttons;
    session.movement  = { x: center.x - session.center.x, y: center.y - session.center.y };
    session.center    = center;
    session.delta     = delta;
    session.direction = directionOf(delta.x, delta.y);
    session.distance  = Math.hypot(delta.x, delta.y);
    session.angle     = session.distance ? Math.atan2(delta.y, delta.x) * 180 / Math.PI : 0;
    session.duration  = time - internal.startTime;
    session.modifiers = { alt: event.altKey, control: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey };
    session.pointers  = pointers.size;
    session.travel    = Math.max(session.travel, session.distance);

    // velocity over the recent samples: a pointer that rested before release reads as still
    const samples = internal.samples;
    samples.push({ time, x: center.x, y: center.y });
    while (samples.length > 2 && time - samples[0].time > VELOCITY_WINDOW) samples.shift();
    const first   = samples[0];
    const elapsed = time - first.time;
    const x       = elapsed > 0 ? (center.x - first.x) / elapsed : 0;
    const y       = elapsed > 0 ? (center.y - first.y) / elapsed : 0;
    session.velocity = { speed: Math.hypot(x, y), x, y };

    if (internal.pair) {
      const [a, b] = firstTwo();
      const angle  = angleBetween(a, b);
      session.rotation = internal.pair.rotation + turn(internal.pair.angle, angle);
      session.scale    = internal.pair.scale * distanceOf(a, b) / internal.pair.distance;
    }
  }

  // :::::: SESSION

  function open (event) {
    const point = { x: event.clientX, y: event.clientY };
    internal = { pair: null, samples: [], startTime: event.timeStamp };
    session  = {
      angle           : 0,
      buttons         : event.buttons,
      center          : point,
      claims          : new Set,
      delta           : { x: 0, y: 0 },
      direction       : null,
      distance        : 0,
      duration        : 0,
      element,
      input           : event.pointerType || 'mouse',
      maximumPointers : 1,
      modifiers       : { alt: event.altKey, control: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey },
      movement        : { x: 0, y: 0 },
      phase           : 'start',
      pointers        : 1,
      rotation        : 0,
      scale           : 1,
      start           : point,
      target          : event.target,
      travel          : 0,
      velocity        : { speed: 0, x: 0, y: 0 },
    };
    listen(true);
  }

  function close () {
    listen(false);
    pointers.clear();
    session = internal = null;
  }

  // :::::: EVENTS

  function down (event) {
    // the other mouse buttons are not gestures, the right one arrives as contextmenu
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (!session) {
      open(event);
      measure(event);
      hooks.start(session, event);
      return;
    }

    session.maximumPointers = Math.max(session.maximumPointers, pointers.size);
    session.phase = 'move';
    rebaseCenter();
    rebasePair();
    measure(event);
    hooks.move(session, event);   // the pointer count changed, recognizers may start or stop
  }

  function move (event) {
    const point = pointers.get(event.pointerId);
    if (!point) return;
    point.x = event.clientX;
    point.y = event.clientY;
    session.phase = 'move';
    measure(event);
    hooks.move(session, event);
  }

  function up (event) {
    if (!pointers.has(event.pointerId)) return;

    if (pointers.size > 1) {
      pointers.delete(event.pointerId);
      session.phase = 'move';
      rebaseCenter();
      rebasePair();
      measure(event);
      hooks.move(session, event);
      return;
    }

    const point = pointers.get(event.pointerId);
    point.x = event.clientX;
    point.y = event.clientY;
    session.phase = 'end';
    measure(event);
    session.pointers = 0;
    const ended = session;
    close();
    hooks.end(ended, event);
  }

  // the browser took a pointer, e.g. to scroll: the whole session is off
  function cancel (event) {
    if (!pointers.has(event.pointerId)) return;
    session.phase = 'cancel';
    const cancelled = session;
    close();
    hooks.cancel(cancelled, event);
  }

  function listen (on) {
    const method = on ? 'addEventListener' : 'removeEventListener';
    window[method]('pointermove',   move);
    window[method]('pointerup',     up);
    window[method]('pointercancel', cancel);
  }

  element.addEventListener('pointerdown', down);

  return {
    get session () { return session; },
    destroy () {
      element.removeEventListener('pointerdown', down);
      if (session) close();
    },
  };
}

export { createTracker, directionOf };
export default createTracker;
