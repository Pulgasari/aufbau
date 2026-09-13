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

export default compile;
