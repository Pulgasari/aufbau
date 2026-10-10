/**
 * The webgl backend: fragment shaders, one pass or several, and chains of filters
 * that stay on the gpu between them.
 *
 * @example
 * ```js
 * import { filterChainWebgl, webglAvailable } from '@aufbau/filters/webgl';
 *
 * if (webglAvailable()) {
 *   await filterChainWebgl(canvas, [{ id: 'fisheye', options: { amount: 0.6 } }, { id: 'bloom' }]);
 * }
 * ```
 *
 * @module
 */

import type { FilterOptions } from './types.d.ts';

/** Runs several webgl filters as one chain on the gpu, in place on a 2d canvas. */
export declare function filterChainWebgl (canvas: HTMLCanvasElement, stages: { id: string; options?: FilterOptions }[]): Promise<void>;

/** Runs the webgl backend of one filter, in place on a 2d canvas. */
export declare function filterToWebgl (canvas: HTMLCanvasElement, id: string, options?: FilterOptions): Promise<void>;

/** Whether this browser can create a webgl context. */
export declare function webglAvailable (): boolean;
