// @aufbau/utils/fp

export type Predicate<T = unknown> = (value: T) => boolean;
export type Rule = string | boolean | Predicate<any> | readonly Rule[];
export type MatchRule<In, Out> = readonly [Rule, ((value: In) => Out) | Out];

// ============================================================================
// core.js
// ============================================================================

export function identity<T> (value: T): T;
export function constant<T> (value: T): () => T;

export function pipe (): <T>(value: T) => T;
export function pipe<A, B> (a: (value: A) => B): (value: A) => B;
export function pipe<A, B, C> (a: (value: A) => B, b: (value: B) => C): (value: A) => C;
export function pipe<A, B, C, D> (a: (value: A) => B, b: (value: B) => C, c: (value: C) => D): (value: A) => D;
export function pipe<A, B, C, D, E> (a: (value: A) => B, b: (value: B) => C, c: (value: C) => D, d: (value: D) => E): (value: A) => E;
export function pipe<A, B, C, D, E, F> (a: (value: A) => B, b: (value: B) => C, c: (value: C) => D, d: (value: D) => E, e: (value: E) => F): (value: A) => F;
export function pipe<A, B, C, D, E, F, G> (a: (value: A) => B, b: (value: B) => C, c: (value: C) => D, d: (value: D) => E, e: (value: E) => F, f: (value: F) => G): (value: A) => G;
export function pipe (...fns: Array<(value: any) => any>): (value: any) => any;

export function compose (): <T>(value: T) => T;
export function compose<A, B> (a: (value: A) => B): (value: A) => B;
export function compose<A, B, C> (b: (value: B) => C, a: (value: A) => B): (value: A) => C;
export function compose<A, B, C, D> (c: (value: C) => D, b: (value: B) => C, a: (value: A) => B): (value: A) => D;
export function compose<A, B, C, D, E> (d: (value: D) => E, c: (value: C) => D, b: (value: B) => C, a: (value: A) => B): (value: A) => E;
export function compose (...fns: Array<(value: any) => any>): (value: any) => any;

// pass arity explicitly when fn uses default or rest parameters
export function curry<A, B, R> (fn: (a: A, b: B) => R, arity?: number): {
  (a: A): (b: B) => R;
  (a: A, b: B): R;
};
export function curry<A, B, C, R> (fn: (a: A, b: B, c: C) => R, arity?: number): {
  (a: A): ReturnType<typeof curry<B, C, R>>;
  (a: A, b: B): (c: C) => R;
  (a: A, b: B, c: C): R;
};
export function curry (fn: (...args: any[]) => any, arity?: number): (...args: any[]) => any;

export function tap<T> (fn: (value: T) => void): (value: T) => T;
export function once<F extends (...args: any[]) => any> (fn: F): F;

export function not<T> (fn: Predicate<T>): Predicate<T>;
export function and<T> (...fns: Array<Predicate<T> | boolean>): Predicate<T>;
export function or<T> (...fns: Array<Predicate<T> | boolean>): Predicate<T>;

// ============================================================================
// is.js
// ============================================================================

export function test (rule: Rule, value: unknown): boolean;

export interface Is {
  (rule: Rule): Predicate;

  alphaNumeric: Predicate;
  array: (value: unknown) => value is unknown[];
  asyncIterable: Predicate;
  base64: Predicate;
  bigInt: (value: unknown) => value is bigint;
  blank: Predicate;
  blankish: Predicate;
  boolean: (value: unknown) => value is boolean;
  buffer: Predicate;
  camelCase: Predicate;
  canvas: Predicate;
  constantCase: Predicate;
  date: (value: unknown) => value is Date;
  dateString: Predicate;
  defined: Predicate;
  domNode: Predicate;
  element: Predicate;
  elementish: Predicate;
  email: Predicate;
  empty: Predicate;
  emptyArray: Predicate;
  emptyMap: Predicate;
  emptyObject: Predicate;
  emptySet: Predicate;
  emptyString: Predicate;
  entriesList: Predicate;
  error: (value: unknown) => value is Error;
  even: Predicate;
  externalUrl: Predicate;
  filled: Predicate;
  finite: Predicate;
  float: Predicate;
  fragment: Predicate;
  func: (value: unknown) => value is Function;
  function: (value: unknown) => value is Function;
  hexColor: Predicate;
  html: Predicate;
  integer: Predicate;
  internalUrl: Predicate;
  iterable: Predicate;
  json: Predicate;
  kebabCase: Predicate;
  lowerCase: Predicate;
  map: (value: unknown) => value is Map<unknown, unknown>;
  nan: Predicate;
  negative: Predicate;
  node: Predicate;
  nodeList: Predicate;
  null: (value: unknown) => value is null;
  nullish: (value: unknown) => value is null | undefined;
  number: (value: unknown) => value is number;
  numeric: Predicate;
  numericString: Predicate;
  object: (value: unknown) => value is Record<string, unknown>;
  objectList: Predicate;
  odd: Predicate;
  pascalCase: Predicate;
  plainObject: Predicate;
  positive: Predicate;
  primitive: Predicate;
  promise: (value: unknown) => value is Promise<unknown>;
  realNodeList: Predicate;
  realObject: Predicate;
  regExp: (value: unknown) => value is RegExp;
  set: (value: unknown) => value is Set<unknown>;
  snakeCase: Predicate;
  strictObject: Predicate;
  string: (value: unknown) => value is string;
  stringList: Predicate;
  symbol: (value: unknown) => value is symbol;
  undefined: (value: unknown) => value is undefined;
  upperCase: Predicate;
  url: Predicate;
  uuid: Predicate;
  year: Predicate;
  zero: Predicate;

  // deprecated aliases
  date2: Predicate;
  falsy: Predicate;
}

export const is: Is;

export const isAlphaNumeric: Predicate;
export const isArray: (value: unknown) => value is unknown[];
export const isAsyncIterable: Predicate;
export const isBase64: Predicate;
export const isBigInt: (value: unknown) => value is bigint;
export const isBlank: Predicate;
export const isBlankish: Predicate;
export const isBoolean: (value: unknown) => value is boolean;
export const isBuffer: Predicate;
export const isCamelCase: Predicate;
export const isCanvas: Predicate;
export const isConstantCase: Predicate;
export const isDate: (value: unknown) => value is Date;
export const isDateString: Predicate;
export const isDefined: Predicate;
export const isDomNode: Predicate;
export const isElement: Predicate;
export const isElementish: Predicate;
export const isEmail: Predicate;
export const isEmpty: Predicate;
export const isEmptyArray: Predicate;
export const isEmptyMap: Predicate;
export const isEmptyObject: Predicate;
export const isEmptySet: Predicate;
export const isEmptyString: Predicate;
export const isEntriesList: Predicate;
export const isError: (value: unknown) => value is Error;
export const isEven: Predicate;
export const isExternalUrl: Predicate;
export const isFilled: Predicate;
export const isFinite: Predicate;
export const isFloat: Predicate;
export const isFn: (value: unknown) => value is Function;
export const isFragment: Predicate;
export const isFunction: (value: unknown) => value is Function;
export const isHTML: Predicate;
export const isHexColor: Predicate;
export const isInteger: Predicate;
export const isInternalUrl: Predicate;
export const isIterable: Predicate;
export const isJSON: Predicate;
export const isKebabCase: Predicate;
export const isLowerCase: Predicate;
export const isMap: (value: unknown) => value is Map<unknown, unknown>;
export const isNaN: Predicate;
export const isNegative: Predicate;
export const isNode: Predicate;
export const isNodeList: Predicate;
export const isNull: (value: unknown) => value is null;
export const isNullish: (value: unknown) => value is null | undefined;
export const isNumber: (value: unknown) => value is number;
export const isNumeric: Predicate;
export const isNumericString: Predicate;
export const isObject: (value: unknown) => value is Record<string, unknown>;
export const isObjectList: Predicate;
export const isOdd: Predicate;
export const isPascalCase: Predicate;
export const isPlainObject: Predicate;
export const isPositive: Predicate;
export const isPrimitive: Predicate;
export const isPromise: (value: unknown) => value is Promise<unknown>;
export const isRealNodeList: Predicate;
export const isRealObject: Predicate;
export const isRegExp: (value: unknown) => value is RegExp;
export const isSet: (value: unknown) => value is Set<unknown>;
export const isSnakeCase: Predicate;
export const isStrictObject: Predicate;
export const isString: (value: unknown) => value is string;
export const isStringList: Predicate;
export const isSymbol: (value: unknown) => value is symbol;
export const isUUID: Predicate;
export const isUndefined: (value: unknown) => value is undefined;
export const isUpperCase: Predicate;
export const isUrl: Predicate;
export const isYear: Predicate;
export const isZero: Predicate;

// deprecated aliases
export const isDate2: Predicate;
export const isFalsy: Predicate;

// ============================================================================
// match.js
// ============================================================================

export function match<In = any, Out = any> (
  rules: ReadonlyArray<MatchRule<In, Out>>,
  fallback?: ((value: In) => Out) | Out
): (value: In) => Out;

export function ifElse<In, Out> (rule: Rule, onTrue: (value: In) => Out, onFalse: (value: In) => Out): (value: In) => Out;
export function unless<T> (rule: Rule, fn: (value: T) => T): (value: T) => T;
export function when<T> (rule: Rule, fn: (value: T) => T): (value: T) => T;

// ============================================================================
// array.js
// ============================================================================

export function filter<T> (fn: (item: T, index: number) => boolean): (list: readonly T[]) => T[];
export function flat (depth?: number): (list: readonly any[]) => any[];
export function flatMap<T, R> (fn: (item: T, index: number) => R | R[]): (list: readonly T[]) => R[];
export function map<T, R> (fn: (item: T, index: number) => R): (list: readonly T[]) => R[];
export function reduce<T, R> (fn: (accumulator: R, item: T, index: number) => R, initial: R): (list: readonly T[]) => R;

export function every<T> (fn: (item: T, index: number) => boolean): (list: readonly T[]) => boolean;
export function find<T> (fn: (item: T, index: number) => boolean): (list: readonly T[]) => T | undefined;
export function some<T> (fn: (item: T, index: number) => boolean): (list: readonly T[]) => boolean;

export function drop<T> (count: number): (list: readonly T[]) => T[];
export function join (separator?: string): (list: readonly unknown[]) => string;
export function reverse<T> (list: readonly T[]): T[];
export function sort<T> (compare?: (a: T, b: T) => number): (list: readonly T[]) => T[];
export function take<T> (count: number): (list: readonly T[]) => T[];
export function uniq<T> (list: readonly T[]): T[];

// sequence ops work on arrays and strings alike
export function at<T> (index: number): (sequence: readonly T[] | string) => T | string | undefined;
export function concat (...values: any[]): (sequence: any) => any;
export function includes (search: any): (sequence: readonly any[] | string) => boolean;
export function indexOf (search: any): (sequence: readonly any[] | string) => number;
export function slice (start?: number, end?: number): <T extends readonly any[] | string>(sequence: T) => T;

// ============================================================================
// object.js
// ============================================================================

export const entries: typeof Object.entries;
export const keys: typeof Object.keys;
export const values: typeof Object.values;

export function path (keys: string | string[], fallback?: any): (source: any) => any;
export function prop<K extends string> (key: K): (source: any) => any;

export function assoc (key: string, value: any): <T extends object>(source: T) => T & Record<string, any>;
export function dissoc (key: string): <T extends object>(source: T) => Partial<T>;
export function mapValues<T, R> (fn: (value: T, key: string) => R): (source: Record<string, T>) => Record<string, R>;
export function merge (...sources: object[]): <T extends object>(target: T) => T & Record<string, any>;
export function omit (list: readonly string[]): <T extends object>(source: T) => Partial<T>;
export function pick (list: readonly string[]): <T extends object>(source: T) => Partial<T>;

// ============================================================================
// string.js
// ============================================================================

export function capitalize (value: string): string;
export function dedent (value: string): string;
export function slugify (value: string): string;
export function toCamelCase (value: string): string;
export function toConstantCase (value: string): string;
export function toKebabCase (value: string): string;
export function toPascalCase (value: string): string;
export function toSnakeCase (value: string): string;
export function toTitleCase (value: string): string;
export function unquote (value: string): string;

export function toLower (value: string): string;
export function toUpper (value: string): string;
export function trim (value: string): string;
export function trimEnd (value: string): string;
export function trimStart (value: string): string;

export function padEnd (length: number, filler?: string): (value: string) => string;
export function padStart (length: number, filler?: string): (value: string) => string;
export function prefix (text: string): (value: string) => string;
export function replace (search: string | RegExp, replacement: string): (value: string) => string;
export function replaceAll (search: string | RegExp, replacement: string): (value: string) => string;
export function split (separator: string | RegExp): (value: string) => string[];
export function suffix (text: string): (value: string) => string;
export function template (values: Record<string, unknown>): (value: string) => string;
export function truncate (length: number, ending?: string): (value: string) => string;

export function endsWith (search: string): (value: string) => boolean;
export function startsWith (search: string): (value: string) => boolean;
