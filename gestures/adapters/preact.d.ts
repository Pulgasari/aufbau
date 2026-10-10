/**
 * Gestures in preact: a hook that returns a ref callback for a dom element.
 * Handlers are read live, inline arrows are fine and nothing rebinds on a render.
 * Which gestures are active and the thresholds are read once, when the ref lands;
 * remount via `key` to change them.
 *
 * @example
 * ```js
 * import { useGesture } from '@aufbau/gestures/preact';
 *
 * function Card () {
 *   const ref = useGesture({ onSwipeLeft: () => next(), onDoubleTap: () => zoom() });
 *   return html`<div ref=${ref} />`;
 * }
 * ```
 *
 * @module
 */

import type { GestureHandle, GestureOptions } from '../index.d.ts';

export { gestures } from '../index.d.ts';

/** A ref callback that is a ref object as well. */
export interface GestureRef {
  /** Binds the gestures to the node, or unbinds them with null. */
  (node: Element | null): void;
  /** The node. */
  current : Element | null;
  /** What `gestures()` returned for the node. */
  handle  : GestureHandle | null;
}

/** Gestures on the element the returned ref lands on. */
export declare function useGesture (options: GestureOptions): GestureRef;
