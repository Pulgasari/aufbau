// @aufbau/import

// :::::: SHARED

/** Any class or constructor accepted in place of a mode string, e.g. `String`, `Object`, `CSSStyleSheet`. */
export type ModeConstructor = abstract new (...args: never[]) => unknown;

/** Union of every result type a mode table can produce. */
type AnyOf<T> = T[keyof T];

export interface BaseOptions {
  /** Replaces the built-in compiler. Supported by Less, Markdown, Sass, SCSS, TS and JSX. */
  compiler?: (source: string, path: string) => string | Promise<string>;
  /** Passed straight through to `fetch()`. */
  fetchOptions?: RequestInit;
  /** WebAssembly imports object. Only read by `importWASM`. */
  importObject?: WebAssembly.Imports;
  /** Forwarded to the underlying parser. Read by `importCSV` and `importXML`. */
  parserOptions?: Record<string, unknown>;
  /** Cache lifetime in milliseconds. Falls back to the configured default. */
  ttl?: number | null;
  /** Set to `false` to bypass the cache for this call. */
  useCache?: boolean;
}

/** Options object, a bare mode string, or a constructor. */
type Arg<K extends string> = K | ModeConstructor | (BaseOptions & { as?: K });

// :::::: MODE TABLES
// every accepted token maps directly to its result type. canonical names are
// listed first in each block, the remainder are aliases.

export interface CssModes {
  stylesheet: CSSStyleSheet;
  sheet: CSSStyleSheet;
  cssstylesheet: CSSStyleSheet;
  adopted: CSSStyleSheet;

  styleElement: HTMLStyleElement;
  style: HTMLStyleElement;
  tag: HTMLStyleElement;
  htmlstyleelement: HTMLStyleElement;

  raw: string;
  code: string;
  css: string;
  string: string;
  text: string;
  source: string;
}

export interface DataModes<T = unknown> {
  value: T;
  object: T;
  parsed: T;
  json: T;
  js: T;

  raw: string;
  string: string;
  text: string;
  source: string;
}

export interface ModuleModes {
  module: Record<string, unknown>;
  exports: Record<string, unknown>;
  namespace: Record<string, unknown>;

  raw: string;
  code: string;
  source: string;
  string: string;
  text: string;
}

export interface TranspileModes {
  module: Record<string, unknown>;
  exports: Record<string, unknown>;
  namespace: Record<string, unknown>;

  code: string;
  js: string;
  javascript: string;
  compiled: string;

  raw: string;
  source: string;
  string: string;
  text: string;
}

export interface TextModes {
  raw: string;
  code: string;
  source: string;
  string: string;
  text: string;
}

export interface CsvModes<T = Record<string, unknown>> {
  records: T[];
  object: T[];
  objects: T[];
  rows: T[];
  json: T[];

  array: unknown[][];
  arrays: unknown[][];
  matrix: unknown[][];
  tuples: unknown[][];

  raw: string;
  source: string;
  string: string;
  text: string;
}

export interface HtmlModes {
  string: string;
  html: string;
  markup: string;
  raw: string;
  source: string;
  text: string;

  document: Document;
  doc: Document;
  dom: Document;

  element: HTMLDivElement;
  div: HTMLDivElement;
  documentfragment: HTMLDivElement;
  fragment: HTMLDivElement;
  node: HTMLDivElement;
}

export interface JsonlModes<T = unknown> {
  records: T[];
  array: T[];
  arrays: T[];
  objects: T[];
  rows: T[];

  raw: string;
  source: string;
  string: string;
  text: string;
}

export interface MarkdownModes {
  html: string;
  markup: string;
  string: string;

  element: HTMLDivElement;
  dom: HTMLDivElement;
  fragment: HTMLDivElement;
  node: HTMLDivElement;

  raw: string;
  markdown: string;
  source: string;
  text: string;
}

export interface SvgModes {
  string: string;
  markup: string;
  text: string;

  element: SVGElement | Element;
  dom: SVGElement | Element;
  node: SVGElement | Element;
  svgelement: SVGElement | Element;

  raw: string;
  original: string;
  source: string;
}

export interface WasmModes {
  instance: WebAssembly.Exports;
  exports: WebAssembly.Exports;
  webassemblyinstance: WebAssembly.Exports;

  module: WebAssembly.Module;
  compiled: WebAssembly.Module;
  webassemblymodule: WebAssembly.Module;

  buffer: ArrayBuffer;
  arraybuffer: ArrayBuffer;
  binary: ArrayBuffer;
  bytes: ArrayBuffer;
  raw: ArrayBuffer;
}

export interface XmlModes<T = unknown> {
  object: T;
  js: T;
  parsed: T;
  value: T;

  json: string;
  jsonstring: string;
  stringify: string;

  document: XMLDocument;
  doc: XMLDocument;
  dom: XMLDocument;

  raw: string;
  source: string;
  string: string;
  text: string;
  xml: string;
}

// :::::: CONFIGURATION

export interface ConfigureOptions {
  /** Base URL for the CDN fallback. Defaults to `https://esm.sh/`. */
  cdn?: string;
  /**
   * Per-vendor overrides. A string replaces the specifier, an object is used
   * as the already-resolved module. Keys match the internal vendor registry:
   * `fastXmlParser`, `json5`, `less`, `marked`, `papaparse`, `sass`,
   * `smolToml`, `sucrase`, `yaml`.
   */
  modules?: Record<string, string | Record<string, unknown>>;
  /** Default cache lifetime in milliseconds. Defaults to one week. */
  ttl?: number | null;
}

/**
 * Adjusts vendor resolution and cache defaults. Vendor specifiers resolve in
 * order: explicit override, host importmap or `node_modules`, then CDN.
 */
export declare function configure(options?: ConfigureOptions): void;

/**
 * Registers a handler for a file extension, overwriting any built-in one.
 * `modes` takes the same `{ canonical: [aliases] }` shape as the internal
 * tables. Returns the normalized extension key.
 */
export declare function register(
  extension: string,
  handler: (path: string, options: BaseOptions & { as?: unknown }) => Promise<unknown>,
  modes?: Record<string, readonly string[]>
): string;

/**
 * Resolves a mode token to its canonical name. Returns `null` for formats
 * without a mode table, and throws a `TypeError` on an unknown token.
 */
export declare function resolveMode(
  format: string,
  options?: string | ModeConstructor | { as?: string | ModeConstructor }
): string | null;

// :::::: FORMAT HANDLERS

export declare function importCSS<K extends keyof CssModes = 'stylesheet'>(path: string, options?: Arg<K>): Promise<CssModes[K]>;
export declare function importCSS(path: string, options: ModeConstructor): Promise<AnyOf<CssModes>>;

export declare function importCSV<T = Record<string, unknown>, K extends keyof CsvModes<T> = 'records'>(path: string, options?: Arg<K>): Promise<CsvModes<T>[K]>;
export declare function importCSV(path: string, options: ModeConstructor): Promise<AnyOf<CsvModes>>;

export declare function importENV<K extends keyof DataModes<Record<string, string>> = 'value'>(path: string, options?: Arg<K>): Promise<DataModes<Record<string, string>>[K]>;

export declare function importHTML<K extends keyof HtmlModes = 'string'>(path: string, options?: Arg<K>): Promise<HtmlModes[K]>;
export declare function importHTML(path: string, options: ModeConstructor): Promise<AnyOf<HtmlModes>>;

export declare function importINI<T = Record<string, unknown>, K extends keyof DataModes<T> = 'value'>(path: string, options?: Arg<K>): Promise<DataModes<T>[K]>;

export declare function importJS<K extends keyof ModuleModes = 'module'>(path: string, options?: Arg<K>): Promise<ModuleModes[K]>;

export declare function importJSON<T = unknown, K extends keyof DataModes<T> = 'value'>(path: string, options?: Arg<K>): Promise<DataModes<T>[K]>;
export declare function importJSON5<T = unknown, K extends keyof DataModes<T> = 'value'>(path: string, options?: Arg<K>): Promise<DataModes<T>[K]>;
export declare function importJSONC<T = unknown, K extends keyof DataModes<T> = 'value'>(path: string, options?: Arg<K>): Promise<DataModes<T>[K]>;

export declare function importJSONL<T = unknown, K extends keyof JsonlModes<T> = 'records'>(path: string, options?: Arg<K>): Promise<JsonlModes<T>[K]>;

export declare function importJSX<K extends keyof TranspileModes = 'module'>(path: string, options?: Arg<K>): Promise<TranspileModes[K]>;

export declare function importLESS<K extends keyof CssModes = 'stylesheet'>(path: string, options?: Arg<K>): Promise<CssModes[K]>;

export declare function importMD<K extends keyof MarkdownModes = 'html'>(path: string, options?: Arg<K>): Promise<MarkdownModes[K]>;
export declare function importMD(path: string, options: ModeConstructor): Promise<AnyOf<MarkdownModes>>;

export declare function importSASS<K extends keyof CssModes = 'stylesheet'>(path: string, options?: Arg<K>): Promise<CssModes[K]>;
export declare function importSCSS<K extends keyof CssModes = 'stylesheet'>(path: string, options?: Arg<K>): Promise<CssModes[K]>;

export declare function importSVG<K extends keyof SvgModes = 'string'>(path: string, options?: Arg<K>): Promise<SvgModes[K]>;

export declare function importText(path: string, options?: Arg<keyof TextModes>): Promise<string>;

export declare function importTOML<T = unknown, K extends keyof DataModes<T> = 'value'>(path: string, options?: Arg<K>): Promise<DataModes<T>[K]>;

export declare function importTS<K extends keyof TranspileModes = 'module'>(path: string, options?: Arg<K>): Promise<TranspileModes[K]>;
export declare const importTSX: typeof importTS;

export declare function importWASM<K extends keyof WasmModes = 'instance'>(path: string, options?: Arg<K>): Promise<WasmModes[K]>;

export declare function importXML<T = unknown, K extends keyof XmlModes<T> = 'object'>(path: string, options?: Arg<K>): Promise<XmlModes<T>[K]>;

export declare function importYAML<T = unknown, K extends keyof DataModes<T> = 'value'>(path: string, options?: Arg<K>): Promise<DataModes<T>[K]>;

// :::::: MAIN ENTRY

/**
 * Dispatches on the file extension and caches the result via `@bunker/policy`.
 * The extension is read after stripping query and hash, so cache-busted URLs
 * resolve normally.
 *
 * Because the handler is only known at runtime, the result is untyped. For a
 * typed result, call the format handler directly or supply `T` yourself.
 */
export declare function importFile<T = unknown>(
  path: string,
  options?: string | ModeConstructor | (BaseOptions & { as?: string | ModeConstructor })
): Promise<T>;

export default importFile;
