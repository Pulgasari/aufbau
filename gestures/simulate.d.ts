/**
 * Synthetic pointer events along realistic paths: replays a gesture on an element to
 * try recognizers, thresholds and bundles without a device. The browser's own
 * scrolling and touch-action do not react to synthetic events.
 *
 * @example
 * ```js
 * import simulate from '@aufbau/gestures/simulate';
 *
 * await simulate.swipe(list, { direction: 'left' });
 * await simulate.pinch(image, { scale: 2 });
 * ```
 *
 * @module
 */

import type { Direction, Edge, Point } from './index.d.ts';

/** What every simulation takes. */
export interface SimulationOptions {
  /** Where it happens, in client px. Default the center of `target`. */
  at?     : Point;
  /** The element the events are dispatched on. Default the element itself. */
  target? : Element;
}

/** The pointer type of a one-pointer simulation. Default `touch`. */
export type SimulatedInput = 'mouse' | 'pen' | 'touch';

/** Pointers along paths at once, each path mapping t from 0 to 1 to a point. */
export declare function play (element: Element, paths: ((t: number) => Point)[], options?: { duration?: number; hold?: number; input?: SimulatedInput; target?: Element }): Promise<void>;

export declare function tap (element: Element, options?: SimulationOptions & { count?: number; input?: SimulatedInput; interval?: number }): Promise<void>;
export declare function doubleTap (element: Element, options?: SimulationOptions & { input?: SimulatedInput; interval?: number }): Promise<void>;
export declare function longPress (element: Element, options?: SimulationOptions & { duration?: number; input?: SimulatedInput }): Promise<void>;
export declare function swipe (element: Element, options?: SimulationOptions & { direction?: Direction; distance?: number; duration?: number; input?: SimulatedInput }): Promise<void>;
export declare function pan (element: Element, options?: SimulationOptions & { dx?: number; dy?: number; duration?: number; input?: SimulatedInput }): Promise<void>;
export declare function pinch (element: Element, options?: SimulationOptions & { duration?: number; scale?: number; spread?: number }): Promise<void>;
export declare function rotate (element: Element, options?: SimulationOptions & { degrees?: number; duration?: number; radius?: number }): Promise<void>;
export declare function twoFingerTap (element: Element, options?: SimulationOptions & { spread?: number }): Promise<void>;
export declare function doubleTapDrag (element: Element, options?: SimulationOptions & { duration?: number; dy?: number }): Promise<void>;
export declare function edgeSwipe (element: Element, options?: { distance?: number; duration?: number; edge?: Edge; inset?: number; target?: Element }): Promise<void>;

/** All simulations in one object. */
export declare const simulate: {
  doubleTap     : typeof doubleTap;
  doubleTapDrag : typeof doubleTapDrag;
  edgeSwipe     : typeof edgeSwipe;
  longPress     : typeof longPress;
  pan           : typeof pan;
  pinch         : typeof pinch;
  play          : typeof play;
  rotate        : typeof rotate;
  swipe         : typeof swipe;
  tap           : typeof tap;
  twoFingerTap  : typeof twoFingerTap;
};

export default simulate;
