// @aufbau/ass central type notations

export interface CompileOptions {
  // indentation for emitted declarations, default two spaces
  indent?: string;
}

export type Node =
  | { type: 'rule';   selector: string; nodes: Node[] }
  | { type: 'atrule'; name: string; params: string; nodes: Node[] | null }
  | { type: 'decl';   prop: string; value: string }
  | { type: 'value';  value: string; props: string[] };

export function parse (source: string): Node[];
export function transform (nodes: Node[]): Node[];
export function serialize (nodes: Node[], options?: CompileOptions): string;
export function compile (source: string, options?: CompileOptions): string;

export type Interpolation = string | number | boolean | null | undefined | AssResult | Interpolation[] | { [key: string]: unknown };

export interface AssResult {
  readonly source: string;
  readonly css: string;
  readonly sheet: CSSStyleSheet | null;
  adopt (target?: Document | ShadowRoot | Element): () => void;
  toString (): string;
}

export interface AssTag {
  (strings: TemplateStringsArray, ...values: Interpolation[]): AssResult;
  define (props: string, values: Record<string, string | number>): AssTag;
  define (map: Record<string, Record<string, string | number>>): AssTag;
  mixin (name: string, body: string | AssResult): AssTag;
  mixin (map: Record<string, string | AssResult>): AssTag;
  compile (source: string): string;
  readonly registry: { tokens: Map<string, Record<string, string | number>>; mixins: Map<string, string | AssResult> };
}

export function createASS (options?: { tokens?: Record<string, Record<string, string | number>>; mixins?: Record<string, string | AssResult> }): AssTag;
export const ass: AssTag;

export default compile;
