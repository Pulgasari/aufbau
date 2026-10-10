/**
 * The canvas 2d backend. A filter with a pixel pass of its own runs it on the
 * canvas's imageData; any other filter is drawn through its css or svg form with
 * `ctx.filter`, and a webgl only filter goes to the gpu.
 *
 * @example
 * ```js
 * import { filterToCanvas } from '@aufbau/filters/canvas';
 *
 * await filterToCanvas(canvas, 'pixelate', { size: 8 });
 * await filterToCanvas(canvas, 'blur', { amount: 3, backend: 'bridge' });
 * ```
 *
 * @module
 */

import type { CanvasOptions } from './types.d.ts';

/**
 * Applies a filter to a canvas in place.
 * @throws When the forced backend is missing, or nothing can draw the filter on a canvas.
 */
export declare function filterToCanvas (canvas: HTMLCanvasElement, id: string, options?: CanvasOptions): Promise<void>;
