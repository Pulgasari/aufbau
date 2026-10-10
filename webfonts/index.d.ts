/**
 * A curated catalogue of open fonts, loaded on demand with the FontFace api and
 * set as css custom properties. A font is set for a role (body, heading, mono …),
 * each role is its own custom property, so the css decides where it applies.
 *
 * @example
 * ```js
 * import { apply, list, update } from '@aufbau/webfonts';
 *
 * list();                                     // [{ id, name, category }, …]
 * await apply(null, 'manrope');               // the body font of the page
 * await apply('#code', 'jetbrains-mono');     // the mono role, from its category
 * await update(null, { fallback: 'system-ui' });
 * ```
 *
 * @example Fonts from another host
 * ```js
 * import { configure } from '@aufbau/webfonts';
 *
 * configure({ baseUrl: '/fonts' });           // files/<id>-variable.ttf are fetched from there
 * ```
 *
 * @module
 */

/** What a font is for, which decides its default role. */
export type Category = 'display' | 'handwriting' | 'mono' | 'sans' | 'serif';

/** A role and the css custom property it sets, see {@link ROLES}. */
export type Role = 'body' | 'code' | 'heading' | 'mono' | 'sans' | 'serif';

/** One file of a font. */
export interface Face {
  /** The weight or, for a variable font, the range, e.g. `100 900`. */
  weight   : number | string;
  /** `normal` or `italic`. */
  style    : string;
  /** The file, relative to the base url, or a full url. */
  file     : string;
  /** The font-display of the face. Default `swap`. */
  display? : string;
}

/** A font of the catalogue. */
export interface FontMeta {
  /** The id, e.g. `manrope`. */
  id         : string;
  /** The family name, e.g. `Manrope`. */
  name       : string;
  /** Who designed it. */
  designer   : string;
  /** Where it comes from. */
  source     : string;
  /** Its license, e.g. `OFL-1.1`. */
  license    : string;
  /** Whether it may be used commercially. */
  commercial : boolean;
  /** What it is for. */
  category   : Category;
  /** The generic family that stands in until it loaded, or when it fails. */
  fallback   : string;
  /** OpenType features it has, e.g. `calt`. */
  features   : string[];
  /** Its files. */
  faces      : Face[];
}

/** The options of a font on an element. */
export interface FontOptions {
  /** The role, or a custom property of its own (`--my-font`). Default from the category. */
  role?     : Role | `--${string}`;
  /** The generic family behind it. Default from the font. */
  fallback? : string;
}

/** Where a font goes: a selector, an element, a list of elements, or null for the page. */
export type Target = string | Element | Iterable<Element> | null;

/** Every role and the css custom property it sets. */
export declare const ROLES: Readonly<Record<Role, string>>;

/** One font of the catalogue bound to its options. */
export declare class Font {
  /**
   * Binds a font to its options.
   *
   * @param id The id or the name of the font.
   * @param options Its options.
   * @throws When the catalogue has no such font.
   */
  constructor (id: string, options?: FontOptions);

  /** Its entry in the catalogue. */
  meta    : FontMeta;
  /** Its id. */
  id      : string;
  /** The options it is bound to. */
  options : FontOptions;

  /** The role it takes: from the options, else `mono` for a mono font, else `body`. */
  get role (): string;
  /** The value of `font-family`: the name and the fallback. */
  family (options?: FontOptions): string;
  /** Loads every face once, resolves to whether at least one loaded. */
  load (): Promise<boolean>;
  /** Loads it and sets it on the targets, also when loading failed: the fallback takes over then. */
  apply (target?: Target, options?: FontOptions): Promise<this>;
  /** Takes it off the targets, for its role. */
  remove (target?: Target, options?: FontOptions): this;
}

/** The whole catalogue. */
export declare const fonts: FontMeta[];

/** The whole catalogue, the same as {@link fonts}. */
export declare const data: FontMeta[];

/** The catalogue in short: id, name and category of every font. */
export declare const list: () => { category: Category; id: string; name: string }[];

/** A font of the catalogue by its id or its name, or null. */
export declare const find: (key: string) => FontMeta | null;

/** {@link find}, under a name that says what it finds. */
export declare const findFont: typeof find;

/** Sets where the font files come from. Default `https://code.pulgasari.dev/aufbau/webfonts`. */
export declare const configure: (options?: { baseUrl?: string }) => void;

/** One font bound to its options. */
export declare const use: (id: string, options?: FontOptions) => Font;

/** Loads every face of a font once. */
export declare const load: (id: string) => Promise<boolean>;

/** Loads a font and sets it on the targets. */
export declare function apply (target: Target, id: string, options?: FontOptions): Promise<Font>;
/** Loads a font and sets it on the page. */
export declare function apply (id: string, options?: FontOptions): Promise<Font>;

/** Applies new options to the fonts already on the targets, all roles or one. */
export declare function update (target?: Target, options?: FontOptions): Promise<void>;

/** Takes the fonts off the targets, all roles or one. */
export declare function remove (target?: Target, options?: { role?: FontOptions['role'] }): void;

/** Applies several fonts at once: ids, or `{ id, target, role, fallback }`. */
export declare function init (config?: string | (FontOptions & { id: string; target?: Target }) | (string | (FontOptions & { id: string; target?: Target }))[]): Promise<void>;

/** The api as one object. */
declare const webfonts: {
  apply     : typeof apply;
  configure : typeof configure;
  data      : typeof data;
  find      : typeof find;
  fonts     : typeof fonts;
  init      : typeof init;
  list      : typeof list;
  load      : typeof load;
  remove    : typeof remove;
  update    : typeof update;
  use       : typeof use;
  Font      : typeof Font;
  ROLES     : typeof ROLES;
};

export default webfonts;
