/**
 * Lets a tiled background drift, one tile per cycle, so the loop is seamless.
 * Works for any background, not only the patterns of this package. The keyframes,
 * the animation and the css touch no dom.
 *
 * @example
 * ```js
 * import { Motion } from '@aufbau/patterns/motion';
 *
 * const motion = new Motion('up-right', { size: 24, speed: '12s' });
 * motion.apply('.hero');
 * Motion.stop('.hero');
 * ```
 *
 * @module
 */

import type { Direction, Target } from './types.d.ts';

/** Every direction as its unit vector, positive y down, positive x right. */
export declare const DIRECTIONS: Readonly<Record<Direction, readonly [number, number]>>;

/** The tile size and the pace of a drift. */
export interface MotionOptions {
  /** The size of one tile in px, the distance of one cycle. Default `20`. */
  size?   : number | string;
  /** The length of one cycle. Default `8s`. */
  speed?  : string;
  /** The timing function. Default `linear`. */
  timing? : string;
}

/** A drift of a tiled background in one direction. */
export declare class Motion {
  /**
   * Sets up a drift.
   *
   * @param direction Where the tiles move. Default `down`.
   * @param options The tile size and the pace.
   * @throws When the direction is unknown.
   */
  constructor (direction?: Direction, options?: MotionOptions);

  /** Where the tiles move. */
  direction : Direction;
  /** The size of one tile in px. */
  size      : number;
  /** The length of one cycle. */
  speed     : string;
  /** The timing function. */
  timing    : string;

  /** The name of the keyframes, one per direction and size. */
  get name (): string;
  /** The value of the `animation` property. */
  get animation (): string;
  /** The `@keyframes` rule. */
  get keyframes (): string;
  /** The keyframes and the `animation` declaration, for a stylesheet. */
  get css (): string;

  /** Adds the keyframes to the document once and lets the targets drift. */
  apply (target: Target): this;

  /** Stops the drift on the targets. */
  static stop (target: Target): void;
}

export default Motion;
