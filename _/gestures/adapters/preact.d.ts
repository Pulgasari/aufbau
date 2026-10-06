// @aufbau/gestures/preact — type declarations

import type { GestureHandle, GestureOptions } from '../index.js';

// the ref callback useGesture returns. it doubles as a ref object: `current` is
// the node it is attached to, `handle` the compose handle behind it — reach a
// recognizer's imperative api through `handle.parts`.
export interface GestureRef {
  (node: Element | null): void;
  current: Element | null;
  handle: GestureHandle | null;
}

export function useGesture (options: GestureOptions): GestureRef;
export { compose } from '../index.js';
