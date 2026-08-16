// classes/StyleSheet.js

import {
  adoptStylesheet,
  createStylesheet,
} from './../vendors.js';

import { cache }             from './../cache.js';
import { compileStyleInput } from './../methods/index.js';
import { hash }              from './../methods/hash.js';

/**
 * Main StyleScript Sheet Factory using domina under the hood.
 */
export class StyleSheet {
  constructor (name, inputOptions = {}) {
    this.name  = name;
    this.store = inputOptions.store ?? cache;

    this.rawCSS = '';
    this.dirty  = false;

    this.compiledCSS   = '';
    this.hash          = '';
    this.key           = '';
    this.adoptedKey    = null;
    this.sheetInstance = null;
  }

  define (input) {
    this.rawCSS += compileStyleInput(input) + '\n';
    this.dirty   = true;
    return this;
  }

  // single source of "finished css + identity". recomputes only after a define().
  // key is content-addressed (name::hash) so it changes exactly when the css does.
  compile () {
    if (this.dirty || this.key === '') {
      this.compiledCSS = this.rawCSS;
      this.hash        = hash(this.compiledCSS);
      this.key         = `${this.name}::${this.hash}`;
      this.dirty       = false;
    }
    return this.compiledCSS;
  }

  /**
   * Builds and adopts the stylesheet via domina, dedup-keyed on content identity,
   * and seeds the localStorage boot cache. Idempotent: a second adopt() with the
   * same content is a no-op; a content change (new hash -> new key) re-adopts.
   */
  adopt (target = document) {
    const css = this.compile();

    if (this.adoptedKey === this.key && this.sheetInstance) return this.sheetInstance;

    // constructable sheets carry no id; passing key engages domina's own registry
    // dedup, and target is an options field, not a positional node.
    this.sheetInstance = createStylesheet(css, {});
    adoptStylesheet(this.sheetInstance, { target, key: this.key });
    this.adoptedKey    = this.key;

    // reconciliation with a future blocking boot.js: once the canonical
    // constructable sheet is in place, drop any pre-paint boot <style> for this
    // name (stale or matching) so nothing double-applies. same or superseded css,
    // and the sheet is already adopted, so there is no unstyled gap.
    this.releaseBootStyles(target);

    this.persist();
    return this.sheetInstance;
  }

  persist () {
    this.store?.writeSheet?.(this.name, this.hash, this.compiledCSS);
    return this;
  }

  releaseBootStyles (target = document) {
    const root = this.rootFor(target);
    if (!root?.querySelectorAll) return;

    for (const boot of root.querySelectorAll(`style[data-aufbau-script="${this.name}"]`)) {
      boot.remove();
    }
  }

  // mirrors domina's rootOf: a document or shadow root is used as is, an element
  // resolves to its own shadow root, else its containing root or the document.
  rootFor (target = document) {
    const fallback = typeof document !== 'undefined' ? document : null;
    if (!target) return fallback;
    if (target.nodeType === 9 || target.nodeType === 11) return target;
    return target.shadowRoot ?? target.getRootNode?.() ?? fallback;
  }
}

export default StyleSheet;
