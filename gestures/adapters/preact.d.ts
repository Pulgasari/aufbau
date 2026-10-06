// @aufbau/gestures/preact

import type { GestureHandle, GestureOptions } from '../index.d.ts';

export interface GestureRef {
  (node: Element | null): void;
  current : Element | null;
  handle  : GestureHandle | null;
}

export function useGesture (options: GestureOptions): GestureRef;
export { gestures } from '../index.d.ts';
