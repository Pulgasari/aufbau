type Handler = (this: AufbauElement, event: Event, node: Element) => void;

type AttrEntry = Function | { type?: Function, default?: unknown, values?: unknown[], fn?: Function, var?: boolean | string } | unknown;

export declare class Selection implements Iterable<Element> {
  readonly node  : Element | null;
  readonly nodes : Element[];
  readonly size  : number;

  [Symbol.iterator] (): Iterator<Element>;

  $     (target: string | EventTarget | Iterable<EventTarget> | null | undefined): Selection;
  $$    (selector: string): Selection;
  part  (name: string): Selection;
  parts (name: string): Selection;

  filter   (test: (node: Element) => boolean): Selection;
  find     (test: (node: Element) => boolean): Element | null;
  includes (node: unknown): boolean;
  matches  (selector: string): boolean;
  until    (signal: AbortSignal): Selection;

  on (types: string | string[], handler: Handler, options?: AddEventListenerOptions): this;
  on (types: string | string[], selector: string, handler: Handler, options?: AddEventListenerOptions): this;

  onBlur        (handler: Handler, options?: AddEventListenerOptions): this;
  onChange      (handler: Handler, options?: AddEventListenerOptions): this;
  onClick       (handler: Handler, options?: AddEventListenerOptions): this;
  onFocus       (handler: Handler, options?: AddEventListenerOptions): this;
  onInput       (handler: Handler, options?: AddEventListenerOptions): this;
  onKeyDown     (handler: Handler, options?: AddEventListenerOptions): this;
  onPointerDown (handler: Handler, options?: AddEventListenerOptions): this;
  onSubmit      (handler: Handler, options?: AddEventListenerOptions): this;

  emit (type: string, detail?: unknown, options?: { bubbles?: boolean, cancelable?: boolean, composed?: boolean }): boolean;

  attr  (name: string): string | null;
  attr  (map: Record<string, unknown>): this;
  text  (): string;
  text  (value: string): this;
  focus (options?: FocusOptions): this;
}

export declare class AufbauElement extends HTMLElement {
  static attr?      : Record<string, AttrEntry>;
  static internals? : boolean | Partial<ElementInternals>;
  static parts?     : string[];
  static reflect?   : string[];
  static shadow?    : boolean | ShadowRootInit;
  static skeleton?  : object | (() => object);
  static styles?    : Styles | (() => Styles);

  static init (name?: string): void;

  readonly focused   : Element | null;
  readonly internals : ElementInternals | null;
  readonly root      : ShadowRoot | this;
  readonly self      : Selection;
  readonly signal    : AbortSignal;
  readonly states    : { add (name: string): unknown, delete (name: string): unknown, has (name: string): boolean, toggle (name: string, force?: boolean): unknown };

  $     (target: string | EventTarget | Iterable<EventTarget> | null | undefined): Selection;
  $$    (selector: string): Selection;
  part  (name: string): Selection;
  parts (name: string): Selection;

  on   (types: string | string[], handler: Handler, options?: AddEventListenerOptions): this;
  on   (types: string | string[], selector: string, handler: Handler, options?: AddEventListenerOptions): this;
  emit (type: string, detail?: unknown, options?: { bubbles?: boolean, cancelable?: boolean, composed?: boolean }): boolean;

  onBlur        (handler: Handler, options?: AddEventListenerOptions): this;
  onChange      (handler: Handler, options?: AddEventListenerOptions): this;
  onClick       (handler: Handler, options?: AddEventListenerOptions): this;
  onFocus       (handler: Handler, options?: AddEventListenerOptions): this;
  onInput       (handler: Handler, options?: AddEventListenerOptions): this;
  onKeyDown     (handler: Handler, options?: AddEventListenerOptions): this;
  onPointerDown (handler: Handler, options?: AddEventListenerOptions): this;
  onSubmit      (handler: Handler, options?: AddEventListenerOptions): this;

  release (): this;
  track<T extends () => unknown> (stop: T): T;

  getAttr (): Record<string, any>;
  getAttr (name: string): any;
  hasAttr (name: string): boolean;
  setAttr (map: Record<string, unknown>): this;


  setSkeleton (on?: boolean): this;
  setVar      (name: string, value: unknown): this;
  setVar      (map: Record<string, unknown>): this;

  invalidate (): this;
  render     (): unknown;
  sync       (): void;
  update     (): this;

  onAdopted          (oldDocument: Document, newDocument: Document): void;
  onAttributeChanged (name: string, oldValue: string | null, newValue: string | null): void;
  onConnected        (): void;
  onConnectedMove    (): void;
  onDisconnected     (): void;
  onRender           (): void;
}

type Constructor<T = AufbauElement> = abstract new (...args: any[]) => T;

export interface AufbauControl {
  value        : any;
  readonly defaultValue : string;
  readonly formValue    : string | null;
  readonly focusTarget  : Element | null;
  readonly form         : HTMLFormElement | null;
  disabled              : boolean;

  commit      (next: unknown, options?: { notify?: boolean }): this;
  formatValue (value: unknown): string;
  parseValue  (raw: string | null): unknown;
  validate    (): this;

  onFormAssociated   (form: HTMLFormElement | null): void;
  onFormDisabled     (disabled: boolean): void;
  onFormReset        (): void;
  onFormStateRestore (state: unknown, mode: string): void;
}

export interface AufbauSource {
  readonly output      : Element;
  readonly sourceNodes : Node[];
  readonly sourceText  : string;

  onSourceChange (): void;
}

export declare function withControl<T extends Constructor> (Base: T): T & Constructor<AufbauControl>;
export declare function withSource<T extends Constructor> (Base: T): T & Constructor<AufbauSource> & { output: string };

export declare const AufbauControlElement : typeof AufbauElement & Constructor<AufbauControl>;
export declare const AufbauSourceElement  : typeof AufbauElement & Constructor<AufbauSource>;

export declare const CONFIG_EVENT : string;

export declare function getConfig      (key: string, fallback?: string): string | undefined;
export declare function onConfigChange (listener: (event: CustomEvent<{ changed: string[] }>) => void): () => void;
export declare function setConfig      (key: string, value: unknown): void;
export declare function setConfig      (entries: Record<string, unknown>): void;

type StyleObject = { [selectorOrProperty: string]: StyleObject | string | number | (string | number)[] | null | undefined | false };
type Styles      = string | StyleObject | { toString (): string } | null | undefined | false | Styles[];

export declare function adoptBaseStyles (key: string, css: Styles): unknown;
export declare function cssOf           (styles: Styles | (() => Styles), owner?: unknown): string;
export declare function applySkin       (skin?: string): void;
export declare function setSkin         (skin: string | null): void;

export declare const session : unknown;
export declare const store   : unknown;
