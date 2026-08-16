// classes/StyleSheet.js

import {
  adoptStylesheet,
  createStylesheet,
  compileStyleInput,
} from './../vendors.js';

/**
 * Main StyleScript Sheet Factory using domina under the hood.
 */
export class StyleSheet {
  constructor (name, inputOptions = {}) {
    this.name   = name;
    this.rawCSS = '';
    this.sheetInstance = null;
  }

  define(input) {
    this.rawCSS += compileStyleInput(input) + '\n';
    return this;
  }

  /**
   * Builds and adopts stylesheet using domina core methods.
   */
  adopt (target = document) {
    // Utilize domina's native createStylesheet & adoptStylesheet primitives
    this.sheetInstance = createStylesheet(this.rawCSS, { id: this.name });
    adoptStylesheet(this.sheetInstance, target);
    return this.sheetInstance;
  }
}

export default StyleSheet;
