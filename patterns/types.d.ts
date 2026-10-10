/**
 * The types the modules of `@aufbau/patterns` share.
 *
 * @module
 */

/** The kind of value a pattern variable takes. */
export type VarType = 'angle' | 'color' | 'number';

/** One variable of a pattern: its type, its default and, for numbers, its range. */
export interface VarSpec {
  /** The kind of value. */
  type     : VarType;
  /** The value the pattern uses when none is given. */
  default  : number | string;
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

/** The variables of a pattern by name. */
export type Vars = Record<string, VarSpec>;

/** What the catalogue knows about a pattern without loading it. */
export interface PatternInfo {
  /** The id, e.g. `dots`. */
  id   : string;
  /** The display name, e.g. `Dots`. */
  name : string;
  /** The variables. */
  vars : Vars;
}

/** The direction a pattern drifts in. */
export type Direction = 'down' | 'down-left' | 'down-right' | 'left' | 'right' | 'up' | 'up-left' | 'up-right';

/** The options of a pattern: its variables by name, plus the switches every pattern has. */
export interface PatternOptions {
  /** Writes `var(--aufbau-pattern-<key>, <default>)` instead of the paint values. */
  live?   : boolean;
  /** The id of the `<pattern>` element, `aufbau-pattern-<id>` by default. */
  svgId?  : string;
  /** Lets the pattern drift in a direction, one tile per cycle. */
  motion? : Direction;
  /** The length of one cycle of the drift, e.g. `8s`. */
  speed?  : string;
  /** The timing function of the drift, `linear` by default. */
  timing? : string;
  /** The value of a variable of the pattern. */
  [variable: string]: unknown;
}

/** A target on the page: a selector, an element, or a list of elements. */
export type Target = string | Element | Iterable<Element>;

/** The render function of a pattern: the whole `<svg>` tile for a set of options. */
export type Render = (options?: PatternOptions) => string;
