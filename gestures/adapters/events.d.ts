/**
 * Gestures as plain event types, for code that only knows event types: a template
 * binding `onSwipeLeft`, `Selection.on('swipeleft')`, a framework's event props.
 * `listen()` turns the recognizer on for that element, shared by everyone listening
 * there, and off again with the last listener.
 *
 * @example
 * ```js
 * import { isGestureEvent, listen } from '@aufbau/gestures/events';
 *
 * const off = listen(node, 'swipeleft', event => next());
 * off();
 * ```
 *
 * @module
 */

import type { GestureHandle, GestureName, GestureOptions } from '../index.d.ts';

/** Every gesture as a dom event type, lowercase: `tap`, `swipeleft`, `pinchmove` … */
export declare const GESTURE_EVENTS: readonly string[];

/** Whether an event type is a gesture, in any case: `swipeLeft`, `swipeleft`. */
export declare function isGestureEvent (type: string): boolean;

/** The gesture name of an event type, or null: `swipeleft` → `swipeLeft`. */
export declare function gestureOf (type: string): GestureName | null;

/**
 * `addEventListener` for a gesture: turns its recognizer on for the element and
 * returns the function that removes the listener again.
 *
 * @throws When the type is no gesture event.
 */
export declare function listen (element: Element, type: string, listener: (event: CustomEvent) => void, options?: AddEventListenerOptions | boolean): () => void;

/** Thresholds and options for the shared gestures() of an element. */
export declare function configure (element: Element, options: GestureOptions): GestureHandle;

/** The shared handle of an element, or null while nothing listens there. */
export declare function handleOf (element: Element): GestureHandle | null;

export default listen;
