/**
 * Tileable svg patterns, painted as a background image. Each pattern is a plain
 * function of its own module, `@aufbau/patterns/<id>`; the catalogue knows all of
 * them without loading one and loads an implementation on first use. Any pattern
 * can drift, one tile per cycle.
 *
 * @example On an element
 * ```js
 * import { apply, remove, update } from '@aufbau/patterns';
 *
 * await apply('.box', 'dots', { fg: '#f00', motion: 'up', speed: '12s' });
 * await update('.box', { fg: '#0f0' });
 * remove('.box');
 * ```
 *
 * @example One pattern with its options
 * ```js
 * import { use } from '@aufbau/patterns';
 *
 * const dots = use('dots', { fg: '#f00', size: 16 });
 * await dots.image(); // url("data:image/svg+xml,…")
 * ```
 *
 * @module
 */

import type { PatternInfo, PatternOptions, Render, Target } from './types.d.ts';
import { DIRECTIONS, Motion } from './motion.d.ts';

export type * from './types.d.ts';
export type { MotionOptions } from './motion.d.ts';
export { DIRECTIONS, Motion };

/** One pattern bound to its options. Every method takes more options that win over them. */
export declare class Pattern {
  /**
   * Binds a pattern to its options.
   *
   * @param id The id of the pattern, e.g. `dots`.
   * @param options Its options.
   * @throws When there is no pattern with that id.
   */
  constructor (id: string, options?: PatternOptions);

  /** The static metadata. */
  meta    : PatternInfo;
  /** The id. */
  id      : string;
  /** The options it is bound to. */
  options : PatternOptions;

  /** The whole `<svg>` tile. `live: true` gives the form driven by css custom properties. */
  svg (options?: PatternOptions): Promise<string>;
  /** The tile as a css `url("data:…")`. */
  image (options?: PatternOptions): Promise<string>;
  /** The `background-image` declaration. */
  css (options?: PatternOptions): Promise<string>;
  /** Paints the pattern on the targets, and lets it drift with `motion`. */
  apply (target: Target, options?: PatternOptions): Promise<this>;
  /** Takes any pattern off the targets. */
  remove (target: Target): this;
}

/** The static metadata of every pattern by id. */
export declare const manifest: Record<string, PatternInfo>;

/**
 * The render function of a pattern, imported once.
 * @throws When there is no pattern with that id.
 */
export declare function load (id: string): Promise<Render>;

/** The catalogue: every pattern with its variables. */
export declare const list: () => PatternInfo[];

/** The catalogue as it was at import. */
export declare const data: PatternInfo[];

/** One pattern bound to its options. */
export declare const use: (id: string, options?: PatternOptions) => Pattern;

/** Paints a pattern on the targets. */
export declare const apply: (target: Target, id: string, options?: PatternOptions) => Promise<Pattern>;

/** Changes the options of the pattern already on the targets. */
export declare function update (target: Target, options?: PatternOptions): Promise<void>;

/** Takes any pattern off the targets and stops its drift. */
export declare function remove (target: Target): void;

/** {@link Pattern.svg} without a Pattern around it. */
export declare const patternSvg: (id: string, options?: PatternOptions) => Promise<string>;
/** {@link Pattern.image} without a Pattern around it. */
export declare const patternImage: (id: string, options?: PatternOptions) => Promise<string>;

/** {@link apply}, under the name it has in `@aufbau/api`. */
export declare const applyPattern: typeof apply;
/** {@link remove}, under the name it has in `@aufbau/api`. */
export declare const removePattern: typeof remove;
/** {@link update}, under the name it has in `@aufbau/api`. */
export declare const updatePattern: typeof update;
/** {@link use}, under the name it has in `@aufbau/api`. */
export declare const usePattern: typeof use;

/** The api as one object. */
declare const patterns: {
  apply    : typeof apply;
  data     : typeof data;
  list     : typeof list;
  load     : typeof load;
  manifest : typeof manifest;
  remove   : typeof remove;
  update   : typeof update;
  use      : typeof use;
  Motion   : typeof Motion;
  Pattern  : typeof Pattern;
};

export default patterns;
