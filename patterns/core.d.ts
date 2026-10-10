/**
 * The string helpers the patterns are built from, pure but for
 * {@link toElements}, so the patterns render in node as well.
 *
 * @example A pattern of its own
 * ```js
 * import { patternTag, resolve } from '@aufbau/patterns/core';
 *
 * const vars = { fg: { type: 'color', default: '#000' }, size: { type: 'number', default: 16, bake: true } };
 * const plus = (options = {}) => {
 *   const v = resolve(vars, options);
 *   return patternTag('plus', v.size, `<path d="M8 4v8M4 8h8" stroke="${v.fg}"/>`, 0, options);
 * };
 * ```
 *
 * @module
 */

import type { PatternOptions, Target, Vars } from './types.d.ts';

/** The prefix of the css custom properties that drive live patterns: `--aufbau-pattern-`. */
export declare const PREFIX: '--aufbau-pattern-';

/** The element id of a pattern: `dots` gives `aufbau-pattern-dots`. */
export declare const svgId: (id: string) => string;

/**
 * Every variable as the string the markup gets: the literal value, or with
 * `live: true` a `var(--aufbau-pattern-<key>, <default>)` for the ones not baked.
 */
export declare function resolve (vars: Vars, options?: PatternOptions): Record<string, string>;

/** A pattern body as a whole tile: an `<svg>` with the `<pattern>` and a rect painting it. */
export declare function patternTag (id: string, size: number | string, body: string, transform: number | string, options?: PatternOptions): string;

/** An svg string as a data uri that works in css. */
export declare function encodeSvg (svg: string): string;

/** The elements of a target: a selector, an element, or a list of elements. */
export declare function toElements (target: Target): Element[];
