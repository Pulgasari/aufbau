/**
 * An overlay that draws the session of a gestures() handle live: pointers, start,
 * center, delta and velocity, plus a panel with the numbers, the claims and the
 * last gestures. For tuning thresholds on a real device.
 *
 * @module
 */

import type { GestureHandle } from './index.d.ts';

/** The options of {@link debug}. */
export interface DebugOptions {
  /** The color of the drawing. Default `#ff2d7a`. */
  color? : string;
  /** How many recent gestures the panel lists. Default `8`. */
  log?   : number;
}

/** Shows the overlay for a handle, returns the function that removes it. */
export declare function debug (handle: GestureHandle, options?: DebugOptions): () => void;

export default debug;
