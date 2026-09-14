// @aufbau/store central type notations

export type LeafType = 'bool' | 'number' | 'string' | 'enum' | 'list' | 'ref' | 'derived';

export interface LeafSpec {
  type?: LeafType;
  value?: unknown;
  values?: unknown[];                 // enum options (presence implies enum)
  min?: number;
  max?: number;
  step?: number;
  get?: (store: Store) => unknown;    // derived
}

// a bare literal (type inferred), a derived function, or a config object
export type SchemaEntry = boolean | number | string | unknown[] | ((store: Store) => unknown) | LeafSpec;
export type Schema = Record<string, SchemaEntry>;

export interface Adapter {
  get (key: string): unknown | Promise<unknown>;
  set (key: string, value: unknown): void;
  subscribe? (key: string, cb: (value: unknown) => void): () => void;
}

export type Persist = 'local' | 'session' | 'memory' | 'none' | Storage | Adapter;

export interface StoreOptions {
  key?: string;         // persistence prefix; per-key entries are `${key}:${leaf}`
  persist?: Persist;
}

export interface Store {
  // bare access: read a value; assignment writes it
  [key: string]: any;

  // value
  get (key: string): any;
  set (key: string, value: any): Store;
  reset (key?: string): Store;              // omit key to reset all

  // reactive projections
  onChange (key: string, fn: (value: any) => void): () => void;
  toNode (key: string): Text;
  toElement (key: string, opts?: { label?: string }): HTMLElement;   // needs @aufbau/store/gui
  sync (key: string, binding: string, target?: Element): () => void; // provisional

  // lifecycle / introspection
  define (key: string, spec: SchemaEntry): Store;
  delete (key: string): Store;
  leaf (key: string): any;
  readonly keys: string[];
  snapshot (): Record<string, any>;
  readonly ready: Promise<Store>;

  // typed methods (available on the matching leaf type)
  toggle (key: string, item?: any): any;
  on (key: string): boolean;
  off (key: string): boolean;
  cycle (key: string): any;
  options (key: string): any[];
  inc (key: string, n?: number): number;
  dec (key: string, n?: number): number;
  clamp (key: string): number;
  round (key: string, places?: number): number;
  toKebab (key: string): string;
  toSlug (key: string): string;
  toUpper (key: string): string;
  toLower (key: string): string;
  trim (key: string): string;
  push (key: string, item: any): any[];
  remove (key: string, item: any): any[];
  clear (key: string): any[];
  has (key: string, item: any): boolean;
}

export function store (schema: Schema, options?: StoreOptions): Store;
export function useElementAdapter (fn: (store: Store, key: string, opts?: any) => HTMLElement): void;

export default store;
