/**
 * A filter stack that leaves its source alone, for editors: an ordered list of
 * stages rendered onto a canvas on demand. Any backend mixes in one stack, runs of
 * webgl stages stay on the gpu.
 *
 * @example
 * ```js
 * import { createPipeline } from '@aufbau/filters/pipeline';
 *
 * const pipeline = createPipeline(image).add('grayscale').add('vignette', { amount: 0.6 });
 * await pipeline.render(canvas);
 * pipeline.toggle(0);
 * await pipeline.render(canvas);
 * ```
 *
 * @module
 */

import type { CanvasOptions } from './types.d.ts';

/** One stage of a pipeline. */
export interface Stage {
  /** The id of the filter. */
  id      : string;
  /** Its options. */
  options : CanvasOptions;
  /** Whether it runs. */
  enabled : boolean;
}

/** A filter stack over one source. Every change returns the pipeline, for chaining. */
export interface Pipeline {
  /** The stages, in order. */
  stages : Stage[];
  /** Adds a stage at the end. */
  add    (id: string, options?: CanvasOptions): Pipeline;
  /** Adds a stage at an index. */
  insert (index: number, id: string, options?: CanvasOptions): Pipeline;
  /** Removes the stage at an index. */
  remove (index: number): Pipeline;
  /** Moves a stage from one index to another. */
  move   (from: number, to: number): Pipeline;
  /** Merges options into the stage at an index. */
  set    (index: number, options: CanvasOptions): Pipeline;
  /** Turns the stage at an index on or off, or over when `on` is left out. */
  toggle (index: number, on?: boolean): Pipeline;
  /** Removes every stage. */
  clear  (): Pipeline;
  /** Draws the source through every enabled stage onto `target`, a new canvas when left out. */
  render (target?: HTMLCanvasElement): Promise<HTMLCanvasElement>;
}

/** Creates a pipeline over a canvas, image, bitmap or video. */
export declare function createPipeline (source: CanvasImageSource): Pipeline;
