// @aufbau/gestures
// @ts-self-types="./index.d.ts"
// a gesture as easy as a click: gestures(element, { onSwipeLeft, onTap, … }).
// the tracker measures, the recognizers decide, every gesture is a dom event on
// the element the pointer went down on. see concept.md.
//
//   const handle = gestures(element, { onTap: gesture => …, onSwipeLeft: { minimumSpeed: 1, handler } });
//   element.addEventListener('swipeleft', event => …);
//   handle.on('doubleTap', gesture => …);   // later, touch-action follows
//   handle.destroy();

import { createTracker }       from './tracker.js';
import { stricterTouchAction } from './shared.js';
import { doubleTapDrag, edgeSwipe, longPress, pan, pinch, press, rotate, secondary, swipe, tap, wheel } from './recognizers/index.js';

const RECOGNIZERS = { doubleTapDrag, edgeSwipe, longPress, pan, pinch, press, rotate, secondary, swipe, tap, wheel };

// gesture name -> the recognizer reporting it, e.g. doubleTap -> tap
const OWNERS = {};
for (const [name, recognizer] of Object.entries(RECOGNIZERS)) for (const gesture of recognizer.gestures) OWNERS[gesture] = name;

const GESTURES = Object.freeze(Object.keys(OWNERS).sort());

const HANDLER = /^on[A-Z]/;

const eventTypeOf = gesture => gesture.toLowerCase();                // swipeLeft -> swipeleft
const gestureOf   = key     => key[2].toLowerCase() + key.slice(3);   // onSwipeLeft -> swipeLeft
const ownerOf     = name    => OWNERS[name] ?? (RECOGNIZERS[name] ? name : null);
const priorityOf  = name    => RECOGNIZERS[name].priority ?? 0;

const known = (name, where) => {
  if (!ownerOf(name)) throw new TypeError(`[@aufbau/gestures] unknown gesture "${name}"${where ? ` (${where})` : ''}`);
  return name;
};

// the session as it goes out: everything but the internals
const snapshot = (session, extra) => {
  const { claims, own, startTime, ...fields } = session ?? {};
  return { ...fields, ...extra };
};

// a guard only filters what reaches its handler, see "thresholds versus guards"
function passes (guard, detail) {
  if (guard.input           && guard.input !== detail.input)                    return false;
  if (guard.minimumDistance && !(detail.distance >= guard.minimumDistance))     return false;
  if (guard.minimumSpeed    && !(detail.velocity?.speed >= guard.minimumSpeed)) return false;
  if (guard.pointers        && guard.pointers !== detail.maximumPointers)       return false;
  return true;
}

function gestures (element, options = {}) {
  let settings = { ...options };
  let parts    = [];          // [name, part] by priority
  let tracker  = null;
  let previous = {};          // inline styles as they were, restored on rebuild and destroy
  let built    = null;        // what the current parts were built for
  let stale    = false;       // a rebuild waits for the running session to end
  let alive    = true;

  const entries   = new Map;  // gesture -> Set of { guard, handler, source }
  const listeners = new Map;  // gesture -> dom listener
  const switches  = new Map;  // recognizer -> boolean | (gesture) => boolean
  const decided   = new Map;  // recognizer -> what its predicate said at session start
  const called    = new Set;  // recognized through handle.recognize()
  let recognized  = new Set;  // recognized through options.recognize

  // :::::: HANDLERS
  // handlers only take the gestures of this element, not the ones bubbling up from a nested gestures()

  function listenerFor (gesture) {
    return event => {
      if (event.detail?.element !== element) return;
      for (const { guard, handler } of entries.get(gesture) ?? []) if (passes(guard, event.detail)) handler(event.detail, event);
    };
  }

  function add (gesture, value, source) {
    const { handler, ...guard } = typeof value === 'function' ? { handler: value } : value;
    const entry = { guard, handler, source };
    if (!entries.has(gesture)) entries.set(gesture, new Set);
    entries.get(gesture).add(entry);
    if (!listeners.has(gesture)) {
      const listener = listenerFor(gesture);
      listeners.set(gesture, listener);
      element.addEventListener(eventTypeOf(gesture), listener);
    }
    return entry;
  }

  function drop (gesture, entry) {
    const set = entries.get(gesture);
    if (!set?.delete(entry) || set.size) return;
    entries.delete(gesture);
    element.removeEventListener(eventTypeOf(gesture), listeners.get(gesture));
    listeners.delete(gesture);
  }

  // the handlers and names an options object carries, replacing the previous ones from options
  function adopt (next) {
    for (const [gesture, set] of [...entries]) for (const entry of [...set]) if (entry.source === 'options') drop(gesture, entry);
    for (const [key, value] of Object.entries(next)) {
      if (!HANDLER.test(key) || value == null) continue;
      add(known(gestureOf(key), key), value, 'options');
    }
    recognized = new Set((next.recognize ?? []).map(name => known(name, 'recognize')));
  }

  // :::::: SWITCHES
  // a predicate is asked once per pointer session, at its start, and per gesture otherwise

  function allowed (name, detail) {
    const value = switches.get(name);
    if (value === undefined || value === true) return true;
    if (value === false) return false;
    if (decided.has(name)) return decided.get(name);
    return detail ? !!value(detail) : true;
  }

  // :::::: EMITTING

  function emit (gesture, session, extra = {}, sourceEvent = null) {
    if (!alive) return;
    const detail = snapshot(session, { element, ...extra, gesture });
    detail.sourceEvent = sourceEvent ?? detail.sourceEvent ?? null;
    if (!allowed(OWNERS[gesture], detail)) return;
    const target = detail.target?.isConnected && element.contains(detail.target) ? detail.target : element;
    target.dispatchEvent(new CustomEvent(eventTypeOf(gesture), { bubbles: true, cancelable: true, composed: true, detail }));
  }

  // :::::: RECOGNIZERS
  // a higher priority hears the session first: edgeSwipe decides before pan does

  const hooks = {};
  for (const hook of ['start', 'move', 'end', 'cancel']) {
    hooks[hook] = (session, event) => {
      if (hook === 'start') {
        decided.clear();
        for (const [name] of parts) {
          const value = switches.get(name);
          if (typeof value === 'function') decided.set(name, !!value(snapshot(session, { element })));
        }
      }
      for (const [name, part] of parts) {
        if (session.phase === 'cancel' && hook !== 'cancel') break;   // a claim elsewhere took the session meanwhile
        if (allowed(name)) part[hook]?.(session, event);
      }
      if (stale && (hook === 'end' || hook === 'cancel')) build();
    };
  }

  const preventDrag = event => event.preventDefault();

  const setStyle = (property, value) => {
    if (!(property in previous)) previous[property] = element.style[property];
    element.style[property] = value;
  };

  function teardown () {
    for (const [, part] of parts) part.destroy?.();
    parts = [];
    element.removeEventListener('dragstart', preventDrag);
    Object.assign(element.style, previous);
    previous = {};
  }

  function build () {
    stale = false;
    teardown();

    const handled = new Set([...entries.keys()]);
    const active  = new Set([...handled, ...recognized, ...called]);
    const names   = [...new Set([...active].map(ownerOf))].sort((a, b) => priorityOf(b) - priorityOf(a));
    const session = () => tracker?.session ?? null;

    parts = names.map(name => [name, RECOGNIZERS[name]({ active, element, emit, handled, options: settings[name] ?? {}, session })]);

    const tracked = parts.some(([, part]) => part.start || part.move || part.end || part.cancel);
    if (tracked && !tracker) tracker = createTracker(element, hooks, { coalesced: !!settings.coalesced, yielding: !!settings.yield });
    if (!tracked && tracker) { tracker.destroy(); tracker = null; }

    for (const [, part] of parts) for (const [property, value] of Object.entries(part.style ?? {})) setStyle(property, value);

    // a native drag (a selection, an image, a link) takes the pointer and cancels
    // the session, a recognizer that follows movement turns it off
    if (parts.some(([, part]) => part.nativeDrag === false)) element.addEventListener('dragstart', preventDrag);

    const touchAction = settings.touchAction ?? parts.reduce((current, [, part]) => stricterTouchAction(current, part.touchAction), null);
    if (touchAction) setStyle('touchAction', touchAction);

    built = signature();
  }

  // what the parts depend on: a change of handlers that leaves it alone needs no rebuild
  const signature = () => [[...entries.keys()].sort(), [...recognized].sort(), [...called].sort()].join('|');

  function rebuild (force = false) {
    if (!alive || (!force && built === signature())) return;
    if (tracker?.session) stale = true;
    else build();
  }

  adopt(settings);
  build();

  const handle = {
    element,
    get session () { return tracker ? tracker.session : null; },

    // a recognizer or a gesture of it on or off, or a predicate asked at the start of each session
    enable (name, value = true) {
      switches.set(ownerOf(known(name)), value);
      return handle;
    },

    on (name, value) {
      const entry = add(known(name), value, 'on');
      rebuild();
      return () => { drop(name, entry); rebuild(); };
    },

    recognize (names, value = true) {
      for (const name of [names].flat()) value ? called.add(known(name)) : called.delete(name);
      rebuild();
      return handle;
    },

    // new thresholds, handlers or options, merged into the current ones. the
    // recognizers are rebuilt, after the running session if there is one
    set (next = {}) {
      settings = { ...settings, ...next };
      adopt(settings);
      if (('coalesced' in next || 'yield' in next) && tracker && !tracker.session) { tracker.destroy(); tracker = null; }
      rebuild(true);
      return handle;
    },

    destroy () {
      alive = false;
      tracker?.destroy();
      tracker = null;
      teardown();
      for (const [gesture, listener] of listeners) element.removeEventListener(eventTypeOf(gesture), listener);
      listeners.clear();
      entries.clear();
    },
  };

  return handle;
}

export { GESTURES, gestures };
export * from './bundles/index.js';
export default gestures;
