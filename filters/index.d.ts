/**
 * Image effects with several backends: css, svg, canvas and webgl.
 *
 * On an element a filter is the native css function when it has one, otherwise
 * its svg `<filter>` is injected once into a shared hidden host. On a canvas it is
 * the filter's own pixel pass, its css or svg form bridged through `ctx.filter`, or
 * a fragment shader. Every filter is also a module of its own,
 * `@aufbau/filters/<id>`, and the catalogue loads an implementation only when it
 * is used.
 *
 * @example On an element
 * ```js
 * import { apply, remove, update } from '@aufbau/filters';
 *
 * await apply('#logo', 'glitch-rgb', { offsetX: 6 });
 * await update('#logo', { offsetX: 12 });
 * remove('#logo');
 * ```
 *
 * @example One filter with its options
 * ```js
 * import { use } from '@aufbau/filters';
 *
 * const blur = use('blur', { amount: 4 });
 * await blur.css();          // "blur(4px)"
 * await blur.canvas(canvas); // in place
 * ```
 *
 * @module
 */

import type { ApplyOptions, Backends, CanvasOptions, FilterInfo, FilterOptions, LoadedFilter, Target, Vars } from './types.d.ts';
import type { Pipeline } from './pipeline.d.ts';

export type * from './types.d.ts';
export type { Pipeline, Stage } from './pipeline.d.ts';

/** The static metadata of a filter, as the catalogue keeps it. */
export interface FilterMeta {
  /** The id. */
  id       : string;
  /** The display name. */
  name     : string;
  /** The variables. */
  vars     : Vars;
  /** Which backends the module itself provides. */
  backends : Backends;
}

/** One filter bound to its options. Every method takes more options that win over them. */
export declare class Filter {
  /**
   * Binds a filter to its options.
   *
   * @param id The id of the filter, e.g. `blur`.
   * @param options Its options.
   * @throws When there is no filter with that id.
   */
  constructor (id: string, options?: FilterOptions);

  /** The static metadata. */
  meta    : FilterMeta;
  /** The id. */
  id      : string;
  /** The options it is bound to. */
  options : FilterOptions;

  /** The backends that can realise it. */
  get backends (): Backends;
  /** `url(#aufbau-filter-<id>)`, the reference to its injected `<filter>`. */
  get url (): string;

  /** The native css filter function, or null without a css backend. */
  css (options?: FilterOptions): Promise<string | null>;
  /**
   * The `<filter>` markup. `live: true` gives the form driven by css custom properties.
   * @throws When the filter has no svg backend.
   */
  svg (options?: FilterOptions): Promise<string>;
  /** Injects the live `<filter>` into the shared host once, resolves to its element id. */
  ensure (options?: FilterOptions): Promise<string>;
  /** Filters a canvas in place. */
  canvas (canvas: HTMLCanvasElement, options?: CanvasOptions): Promise<void>;
  /** Filters a canvas in place with the webgl backend. */
  webgl (canvas: HTMLCanvasElement, options?: FilterOptions): Promise<void>;
  /** Puts the filter on the targets. */
  apply (target: Target, options?: ApplyOptions): Promise<this>;
  /** Takes any filter off the targets. */
  remove (target: Target): this;
}

/** The catalogue: every filter with the backends that can realise it. */
export declare const list: () => FilterInfo[];

/** The catalogue as it was at import. */
export declare const data: FilterInfo[];

/** The static metadata of every filter by id. */
export declare const manifest: Record<string, FilterMeta>;

/**
 * The backends that can realise a filter.
 * @throws When there is no filter with that id.
 */
export declare const supports: (id: string) => Backends;

/** One filter bound to its options. */
export declare const use: (id: string, options?: FilterOptions) => Filter;

/** Puts a filter on the targets. */
export declare const apply: (target: Target, id: string, options?: ApplyOptions) => Promise<Filter>;

/** Changes the options of the filter already on the targets. */
export declare function update (target: Target, options?: ApplyOptions): Promise<void>;

/** Takes any filter off the targets. */
export declare function remove (target: Target): void;

/** Loads the implementation of a filter, once. */
export declare function load (id: string): Promise<LoadedFilter>;

/** Creates a filter stack over an image source, see `@aufbau/filters/pipeline`. */
export declare function createPipeline (source: CanvasImageSource): Pipeline;

/** {@link Filter.ensure} without a Filter around it. */
export declare const ensureFilter: (id: string, options?: FilterOptions) => Promise<string>;
/** {@link Filter.canvas} without a Filter around it. */
export declare const filterCanvas: (canvas: HTMLCanvasElement, id: string, options?: CanvasOptions) => Promise<void>;
/** {@link Filter.css} without a Filter around it. */
export declare const filterCss: (id: string, options?: FilterOptions) => Promise<string | null>;
/** {@link Filter.svg} without a Filter around it. */
export declare const filterSvg: (id: string, options?: FilterOptions) => Promise<string>;
/** {@link Filter.webgl} without a Filter around it. */
export declare const filterWebgl: (canvas: HTMLCanvasElement, id: string, options?: FilterOptions) => Promise<void>;
/** Runs several webgl filters as one chain on the gpu, in place on a canvas. */
export declare const filterWebglChain: (canvas: HTMLCanvasElement, stages: { id: string; options?: FilterOptions }[]) => Promise<void>;

/** {@link apply}, under the name it has in `@aufbau/api`. */
export declare const applyFilter: typeof apply;
/** {@link remove}, under the name it has in `@aufbau/api`. */
export declare const removeFilter: typeof remove;
/** {@link update}, under the name it has in `@aufbau/api`. */
export declare const updateFilter: typeof update;
/** {@link use}, under the name it has in `@aufbau/api`. */
export declare const useFilter: typeof use;

/** The api as one object. */
declare const filters: {
  apply          : typeof apply;
  createPipeline : typeof createPipeline;
  data           : typeof data;
  list           : typeof list;
  load           : typeof load;
  manifest       : typeof manifest;
  remove         : typeof remove;
  supports       : typeof supports;
  update         : typeof update;
  use            : typeof use;
  Filter         : typeof Filter;
};

export default filters;
