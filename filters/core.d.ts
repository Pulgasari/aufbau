/**
 * The string and dom helpers the filters are built from. Everything but the dom
 * helpers is pure, so the filters render in node as well (the generated svg assets
 * come from there).
 *
 * @example A filter of its own
 * ```js
 * import { filterTag, resolve } from '@aufbau/filters/core';
 *
 * const vars = { amount: { type: 'number', default: 2 } };
 * const soften = (options = {}) =>
 *   filterTag('soften', `<feGaussianBlur stdDeviation="${resolve(vars, options).amount}"/>`, options);
 * ```
 *
 * @module
 */

import type { FilterOptions, Target, Vars } from './types.d.ts';

/** The prefix of the css custom properties that drive live filters: `--aufbau-filter-`. */
export declare const PREFIX: '--aufbau-filter-';

/** The id of the hidden `<svg>` that holds every injected `<filter>`. */
export declare const HOST_ID: 'aufbau-filter-defs';

/** The element id of a filter: `blur` gives `aufbau-filter-blur`. */
export declare const svgId: (id: string) => string;

/**
 * Every value variable as the string the markup gets: the literal value, or with
 * `live: true` a `var(--aufbau-filter-<key>, <default>)`. Boolean variables are
 * switches, they are left out.
 */
export declare function resolve (vars: Vars, options?: FilterOptions): Record<string, string>;

/**
 * An `<animate>` child for a primitive, `repeatCount="indefinite"` unless given.
 * Empty with `animate: false`. `tag: 'animateTransform'` gives a transform track.
 */
export declare function anim (options: FilterOptions, attrs?: Record<string, string | number>): string;

/** An svg fragment as a percent-encoded data uri, for an `feImage` href. */
export declare function dataUri (svg: string): string;

/** Primitives wrapped in a `<filter>`, its id from `options.svgId` or {@link svgId}. */
export declare function filterTag (id: string, body: string, options?: FilterOptions): string;

/** A `<filter>` wrapped in a zero-size `<svg><defs>`, the form of a standalone asset. */
export declare function wrapSvg (fragment: string): string;

/** The elements of a target: a selector, an element, or a list of elements. */
export declare function toElements (target: Target): Element[];

/** The hidden `<svg>` that holds the injected filters, created on first use. */
export declare function defsHost (): SVGSVGElement;
