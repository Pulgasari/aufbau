/**
 * Fonts from Google Fonts, through its css2 api: a `<link>` per family, added once.
 *
 * @example
 * ```js
 * import { initGoogleFonts, loadGoogleFont } from '@aufbau/webfonts/google';
 *
 * loadGoogleFont({ family: 'Inter', weights: [400, 700] });
 * initGoogleFonts(['Lora', { family: 'Space Grotesk', weights: [500] }]);
 * ```
 *
 * @module
 */

/** One family of Google Fonts. */
export interface GoogleFont {
  /** The family name, e.g. `Inter`. */
  family   : string;
  /** The weights to load. Default `[400]`. */
  weights? : number[];
  /** The font-display. Default `swap`. */
  display? : string;
}

/** Adds the stylesheet of a family to the page, once. */
export declare const loadGoogleFont: (options: GoogleFont) => void;

/** Adds several families: names or {@link GoogleFont} objects. */
export declare const initGoogleFonts: (fontsList?: (string | GoogleFont)[]) => void;
