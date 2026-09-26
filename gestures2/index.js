// @aufbau/gestures2
// a gesture as easy as a click: gestures(element, { onSwipeLeft, onTap, … }).
// the tracker measures, the recognizers decide, every gesture is a dom event on
// the element the pointer went down on. see concept.md.
//
//   const handle = gestures(element, { onTap: gesture => …, onSwipeLeft: { minimumSpeed: 1, handler } });
//   element.addEventListener('swipeleft', event => …);
//   handle.destroy();

import { createTracker }       from './tracker.js';
import { stricterTouchAction } from './shared.js';
import { longPress, pan, press, secondary, swipe, tap } from './recognizers/index.js';

const RECOGNIZERS = { longPress, pan, press, secondary, swipe, tap };

// gesture name -> the recognizer reporting it, e.g. doubleTap -> tap
const OWNERS = {};
for (const [name, recognizer] of Object.entries(RECOGNIZERS)) for (const gesture of recognizer.gestures) OWNERS[gesture] = name;

const HANDLER = /^on[A-Z]/;

const eventTypeOf = gesture => gesture.toLowerCase();                // swipeLeft -> swipeleft
const gestureOf   = key     => key[2].toLowerCase() + key.slice(3);   // onSwipeLeft -> swipeLeft

// the session as it goes out: everything but the internal claims
const snapshot = (session, extra) => {
  const { claims, ...fields } = session ?? {};
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

  // :::::: WHAT IS ACTIVE

  const handlers = new Map;   // gesture -> { handler, ...guard }
  for (const [key, value] of Object.entries(options)) {
    if (!HANDLER.test(key)) continue;
    const gesture = gestureOf(key);
    if (!OWNERS[gesture]) throw new TypeError(`[@aufbau/gestures2] unknown gesture "${gesture}" (${key})`);
    handlers.set(gesture, typeof value === 'function' ? { handler: value } : value);
  }

  for (const name of options.recognize ?? []) {
    if (!OWNERS[name] && !RECOGNIZERS[name]) throw new TypeError(`[@aufbau/gestures2] unknown gesture "${name}" in recognize`);
  }

  const handled = new Set(handlers.keys());
  const active  = new Set([...handled, ...(options.recognize ?? [])]);
  const names   = new Set([...active].map(gesture => OWNERS[gesture] ?? gesture));

  // :::::: EMITTING

  function emit (gesture, session, extra = {}, sourceEvent = null) {
    const detail = snapshot(session, { element, ...extra, gesture, sourceEvent });
    const target = detail.target?.isConnected && element.contains(detail.target) ? detail.target : element;
    target.dispatchEvent(new CustomEvent(eventTypeOf(gesture), { bubbles: true, cancelable: true, detail }));
  }

  // handlers only take the gestures of this element, not the ones bubbling up from a nested gestures()
  const listeners = [...handlers].map(([gesture, { handler, ...guard }]) => {
    const listener = event => {
      if (event.detail?.element !== element || !passes(guard, event.detail)) return;
      handler(event.detail, event);
    };
    element.addEventListener(eventTypeOf(gesture), listener);
    return [eventTypeOf(gesture), listener];
  });

  // :::::: RECOGNIZERS

  const parts = [...names].map(name => RECOGNIZERS[name]({ active, element, emit, handled, options: options[name] ?? {} }));

  const each    = hook => (session, event) => { for (const part of parts) part[hook]?.(session, event); };
  const tracked = parts.some(part => part.start || part.move || part.end || part.cancel);
  const tracker = tracked && createTracker(element, { cancel: each('cancel'), end: each('end'), move: each('move'), start: each('start') });

  // :::::: STYLE
  // what was there before comes back on destroy

  const previous = {};
  const setStyle = (property, value) => {
    if (!(property in previous)) previous[property] = element.style[property];
    element.style[property] = value;
  };

  for (const part of parts) for (const [property, value] of Object.entries(part.style ?? {})) setStyle(property, value);

  // a native drag (a selection, an image, a link) takes the pointer and cancels
  // the session, a recognizer that follows movement turns it off
  const preventDrag = event => event.preventDefault();
  const nativeDrag  = !parts.some(part => part.nativeDrag === false);
  if (!nativeDrag) element.addEventListener('dragstart', preventDrag);

  const touchAction = options.touchAction ?? parts.reduce((current, part) => stricterTouchAction(current, part.touchAction), null);
  if (touchAction) setStyle('touchAction', touchAction);

  return {
    element,
    get session () { return tracker ? tracker.session : null; },
    destroy () {
      tracker?.destroy();
      for (const part of parts) part.destroy?.();
      for (const [type, listener] of listeners) element.removeEventListener(type, listener);
      element.removeEventListener('dragstart', preventDrag);
      Object.assign(element.style, previous);
    },
  };
}

export { gestures, RECOGNIZERS };
export default gestures;
