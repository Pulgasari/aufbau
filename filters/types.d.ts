/**
 * The types the modules of `@aufbau/filters` share.
 *
 * @module
 */

/** The kind of value a filter variable takes. */
export type VarType = 'angle' | 'boolean' | 'color' | 'duration' | 'integer' | 'number' | 'text';

/** One variable of a filter: its type, its default and, for numbers, its range. */
export interface VarSpec {
  /** The kind of value. */
  type     : VarType;
  /** The value the filter uses when none is given. */
  default  : boolean | number | string;
  /** The lowest sensible value. */
  min?     : number;
  /** The highest sensible value. */
  max?     : number;
  /** The step a control moves in. */
  step?    : number;
  /** The css unit the value is written with, e.g. `px` or `deg`. */
  unit?    : string;
  /** Always baked into the markup, never driven by a css custom property. */
  bake?    : boolean;
}

/** The variables of a filter by name. */
export type Vars = Record<string, VarSpec>;

/** The backends a filter has. */
export interface Backends {
  /** A native css filter function. */
  css    : boolean;
  /** An svg `<filter>`. */
  svg    : boolean;
  /** A canvas path: its own imageData pass, or any other backend bridged. */
  canvas : boolean;
  /** A fragment shader. */
  webgl  : boolean;
}

/** What the catalogue knows about a filter without loading it. */
export interface FilterInfo {
  /** The id, e.g. `blur`. */
  id       : string;
  /** The display name, e.g. `Blur`. */
  name     : string;
  /** The variables. */
  vars     : Vars;
  /** The backends that can realise it. */
  backends : Backends;
}

/**
 * The options of a filter: its variables by name, plus a few switches that work for
 * every filter.
 */
export interface FilterOptions {
  /** Writes `var(--aufbau-filter-<key>, <default>)` instead of the values. */
  live?    : boolean;
  /** `false` drops the animation and holds the effect at its resting frame. */
  animate? : boolean;
  /** The id of the `<filter>` element, `aufbau-filter-<id>` by default. */
  svgId?   : string;
  /** The value of a variable of the filter. */
  [variable: string]: unknown;
}

/** The options on an element, with the backend to use. */
export interface ApplyOptions extends FilterOptions {
  /** `auto` takes the css function when there is one, the svg `<filter>` otherwise. */
  backend? : 'auto' | 'css' | 'svg';
}

/** The options on a canvas, with the backend to use. */
export interface CanvasOptions extends FilterOptions {
  /** `auto` takes the filter's own imageData pass when it has one, the ctx.filter bridge otherwise. */
  backend? : 'auto' | 'bridge' | 'imagedata' | 'webgl';
}

/** The uniforms of a shader pass, by name. */
export type Uniforms = Record<string, number | number[]>;

/** One pass of a webgl filter. */
export interface WebglPass {
  /** The fragment shader, without the shared preamble. */
  fragment : string;
  /** The uniforms for a set of options. */
  uniforms : (options: FilterOptions) => Uniforms;
}

/** The webgl backend of a filter: one pass, or several in a row. */
export type WebglBackend = WebglPass | { passes: WebglPass[] };

/** The svg backend: the `<filter>` markup for a set of options. */
export type SvgRender = (options?: FilterOptions) => string;

/** The css backend: the native filter function for a set of options. */
export type CssRender = (options?: FilterOptions) => string;

/** The imageData backend: filters the pixels in place. */
export type CanvasRender = (image: ImageData, options?: FilterOptions) => void;

/** A filter module, loaded: its metadata and the backends it has. */
export interface LoadedFilter {
  /** The id. */
  id     : string;
  /** The display name. */
  name   : string;
  /** The variables. */
  vars   : Vars;
  /** The svg backend, or null. */
  render : SvgRender | null;
  /** The css backend, or null. */
  css    : CssRender | null;
  /** The imageData backend, or null. */
  canvas : CanvasRender | null;
  /** The webgl backend, or null. */
  webgl  : WebglBackend | null;
}

/** A target on the page: a selector, an element, or a list of elements. */
export type Target = string | Element | Iterable<Element>;
