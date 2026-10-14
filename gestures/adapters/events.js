// @aufbau/gestures/events
// @ts-self-types="./events.d.ts"
// gestures as plain event types, for code that only knows event types: a
// template binding `onSwipeLeft`, `Selection.on('swipeleft', …)`, a framework's
// event props. that code asks isGestureEvent(type) and, if so, calls listen()
// instead of addEventListener(); the recognizer is turned on for that element,
// shared by everyone listening there, and off again with the last listener.
//
//   import { isGestureEvent, listen } from '@aufbau/gestures/events';
//
//   const off = isGestureEvent(type) ? listen(node, type, handler) : (node.addEventListener(type, handler), () => node.removeEventListener(type, handler));
//   configure(node, { swipe: { minimumDistance: 80 } });   // thresholds for everyone on that element
//
// one shared gestures() per element. a gestures() of its own next to it is fine,
// both dispatch: listen() for one element and gestures() for the same element
// with the same gesture would report it twice.

import { GESTURES, gestures } from './../index.js';

// 'swipeleft' -> 'swipeLeft'
const TYPES = new Map(GESTURES.map(gesture => [gesture.toLowerCase(), gesture]));

const bound = new WeakMap;   // element -> { handle, counts: Map gesture -> listeners }

const gestureOf      = type => TYPES.get(String(type).toLowerCase()) ?? null;
const isGestureEvent = type => TYPES.has(String(type).toLowerCase());

function entryOf (element) {
  let entry = bound.get(element);
  if (!entry) bound.set(element, entry = { counts: new Map, handle: gestures(element) });
  return entry;
}

// addEventListener for a gesture: returns the function that removes it again
function listen (element, type, listener, options) {
  const gesture = gestureOf(type);
  if (!gesture) throw new TypeError(`[@aufbau/gestures] "${type}" is no gesture event`);

  const entry = entryOf(element);
  const count = entry.counts.get(gesture) ?? 0;
  entry.counts.set(gesture, count + 1);
  if (!count) entry.handle.recognize(gesture);

  const eventType = gesture.toLowerCase();
  element.addEventListener(eventType, listener, options);

  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    element.removeEventListener(eventType, listener, options);
    const left = entry.counts.get(gesture) - 1;
    if (left) { entry.counts.set(gesture, left); return; }
    entry.counts.delete(gesture);
    entry.handle.recognize(gesture, false);
    if (!entry.counts.size) { entry.handle.destroy(); bound.delete(element); }
  };
}

// thresholds and options for the shared gestures() of an element, see gestures().set()
const configure = (element, options) => entryOf(element).handle.set(options);

// the shared handle, for enable(), session and the like
const handleOf = element => bound.get(element)?.handle ?? null;

const GESTURE_EVENTS = Object.freeze([...TYPES.keys()]);

export { GESTURE_EVENTS, configure, gestureOf, handleOf, isGestureEvent, listen };
export default listen;
