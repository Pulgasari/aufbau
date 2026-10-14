// @aufbau/gestures/tracker.js
// measures, decides nothing. one session per element, from the first pointer
// down to the last pointer up. the recognizers read the session through the
// hooks, see concept.md for its fields.
//
// hooks.move also runs when a pointer comes or goes, that is when a pinch can
// start or stop. `movement` is the center's change since the previous event,
// `sourceEvent` that event and `time` its timestamp: gestures reported for the
// same event share the sourceEvent, which is how a bundle applies one movement
// only once.
//
// the pointer that went down on the element is followed through window-level
// listeners instead of pointer capture: capture also retargets the compatibility
// mouse events, which would swallow the clicks of buttons inside the element.
//
// a pointer belongs to one session across all elements once a recognizer claims
// it (see own()): nested gestures() see the same pointer, the inner one hears it
// first and wins, an outer session on the same pointer is cancelled. `yielding`
// turns that around for this tracker: it steps back instead.

const VELOCITY_WINDOW = 100;   // ms of samples the velocity is averaged over

const DIRECTIONS = { down: 'down', left: 'left', right: 'right', up: 'up' };

// pointerId -> the tracker holding it, shared by every tracker on the page
const owners = new Map;

const directionOf = (x, y) =>
    x === 0 && y === 0          ? null
  : Math.abs(x) >= Math.abs(y) ? (x > 0 ? DIRECTIONS.right : DIRECTIONS.left)
  :                              (y > 0 ? DIRECTIONS.down  : DIRECTIONS.up);

// signed shortest turn between two angles in degrees, in (-180, 180]
const turn = (from, to) => { const difference = (to - from) % 360; return difference > 180 ? difference - 360 : difference <= -180 ? difference + 360 : difference; };

const angleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
const distanceOf   = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

function createTracker (element, hooks, { coalesced = false, yielding = false } = {}) {
  const pointers = new Map;   // pointerId -> { x, y }
  let session    = null;
  let internal   = null;      // what only the tracker needs
  let owned      = false;     // this tracker holds its pointers in `owners`

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

    session.buttons     = event.buttons;
    session.movement    = { x: center.x - session.center.x, y: center.y - session.center.y };
    session.center      = center;
    session.delta       = delta;
    session.direction   = directionOf(delta.x, delta.y);
    session.distance    = Math.hypot(delta.x, delta.y);
    session.angle       = session.distance ? Math.atan2(delta.y, delta.x) * 180 / Math.PI : 0;
    session.duration    = time - internal.startTime;
    session.modifiers   = { alt: event.altKey, control: event.ctrlKey, meta: event.metaKey, shift: event.shiftKey };
    session.pointerId   = event.pointerId;
    session.pointers    = pointers.size;
    session.pressure    = event.pressure ?? 0;
    session.sourceEvent = event;
    session.tilt        = { x: event.tiltX ?? 0, y: event.tiltY ?? 0 };
    session.time        = time;
    session.travel      = Math.max(session.travel, session.distance);
    session.twist       = event.twist ?? 0;

    // the points the browser merged into this event, only when asked for: a drawing needs them, a drag does not
    if (coalesced) session.coalesced = (event.getCoalescedEvents?.() ?? [event]).map(sample => ({ pressure: sample.pressure, time: sample.timeStamp, x: sample.clientX, y: sample.clientY }));

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

  // :::::: OWNERSHIP

  const control = { abort: () => abort() };

  // called through session.own() when a recognizer claims the session. false
  // means this session stepped back and is cancelled already
  function own () {
    if (yielding) {
      for (const id of pointers.keys()) {
        const other = owners.get(id);
        if (other && other !== control) { abort(); return false; }
      }
    }
    for (const id of pointers.keys()) {
      const other = owners.get(id);
      if (other && other !== control) other.abort();
      owners.set(id, control);
    }
    owned = true;
    return true;
  }

  const release = () => {
    for (const id of pointers.keys()) if (owners.get(id) === control) owners.delete(id);
    owned = false;
  };

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
      own,
      path            : event.composedPath(),
      phase           : 'start',
      pointerId       : event.pointerId,
      pointers        : 1,
      pressure        : event.pressure ?? 0,
      rotation        : 0,
      scale           : 1,
      start           : point,
      target          : event.target,
      tilt            : { x: event.tiltX ?? 0, y: event.tiltY ?? 0 },
      time            : event.timeStamp,
      travel          : 0,
      twist           : event.twist ?? 0,
      velocity        : { speed: 0, x: 0, y: 0 },
      get positions () { return [...pointers].map(([id, { x, y }]) => ({ id, x, y })); },
    };
    listen(true);
  }

  function close () {
    listen(false);
    release();
    pointers.clear();
    session = internal = null;
  }

  // the session ends without a pointerup: another tracker took the pointer, the
  // window lost focus, the page was hidden, or a pointerup never arrived
  function abort () {
    if (!session) return;
    session.phase = 'cancel';
    const cancelled = session;
    close();
    hooks.cancel(cancelled, null);
  }

  // :::::: EVENTS

  function down (event) {
    // the other mouse buttons are not gestures, the right one arrives as contextmenu
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    // a primary pointer of the same kind while a session runs: its pointerup got
    // lost (released over an iframe, an alert, a window switch), the old session is over
    if (session && event.isPrimary && event.pointerType === session.input) abort();

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (!session) {
      open(event);
      measure(event);
      hooks.start(session, event);
      return;
    }

    if (owned && !owners.has(event.pointerId)) owners.set(event.pointerId, control);
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
      if (owners.get(event.pointerId) === control) owners.delete(event.pointerId);
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

  const hidden = () => { if (document.visibilityState === 'hidden') abort(); };

  function listen (on) {
    const method = on ? 'addEventListener' : 'removeEventListener';
    window[method]('pointermove',   move);
    window[method]('pointerup',     up);
    window[method]('pointercancel', cancel);
    window[method]('blur',          abort);
    document[method]('visibilitychange', hidden);
  }

  element.addEventListener('pointerdown', down);

  return {
    abort,
    get session () { return session; },
    destroy () {
      element.removeEventListener('pointerdown', down);
      if (session) close();
    },
  };
}

export { createTracker, directionOf };
export default createTracker;
