// classes/StyleSheet.js

import {
  adoptStylesheet,
  createStylesheet,
  isArray, isFn, isObject, isString,
  setStyleElement,
} from './../vendors.js';

import { deepMerge }         from './../../js/object.js';
import { cache }             from './../cache.js';
import { compileStyleInput } from './../methods/compileStyleInput.js';
import { hash }              from './../methods/hash.js';

/**
 * A stylesheet definition: a deep-mergeable rule tree with a content-addressed
 * identity (name::hash). Pure until adopt(), which renders it either as a
 * <style id> element (document) or an adopted constructable sheet (shadow root).
 */
export class StyleSheet {
  constructor (name, options = {}) {
    this.name       = name ?? options.id ?? null;
    this.id         = options.id ?? name ?? null;
    this.layer      = options.layer ?? null;
    this.media      = options.media ?? null;
    this.controller = options.controller ?? null;
    this.store      = options.store ?? cache;
    this.target     = options.target ?? null;

    this.tree    = {};
    this.rawTail = '';
    this.dirty   = false;

    this.compiledCSS   = '';
    this.hash          = '';
    this.key           = '';
    this.adoptedKey    = null;
    this.sheetInstance = null;
    this.element       = null;
  }

  // objects deep-merge into the rule tree; strings/functions/arrays are not
  // mergeable, so they compile immediately and append to a raw tail.
  define (input) {
    if (isString(input) || isFn(input) || isArray(input)) {
      this.rawTail += compileStyleInput(input, this.controller) + '\n';
    } else if (isObject(input)) {
      deepMerge(this.tree, input);
    }
    this.dirty = true;
    return this;
  }

  // single source of "finished css + identity". the cascade layer is baked into
  // the text here so both render paths carry it identically.
  compile () {
    if (this.dirty || this.key === '') {
      const body = compileStyleInput(this.tree, this.controller) + this.rawTail;
      this.compiledCSS = this.layer ? `@layer ${this.layer} {\n${body}}\n` : body;
      this.hash        = hash(this.compiledCSS);
      this.key         = `${this.name}::${this.hash}`;
      this.dirty       = false;
    }
    return this.compiledCSS;
  }

  /**
   * Renders and adopts. Idempotent on content (same key -> no-op). A document
   * target renders a <style id> (stable DOM identity the boot path reconciles
   * against); a shadow root renders an adopted constructable sheet.
   */
  adopt (target = this.target ?? (typeof document !== 'undefined' ? document : null)) {
    this.compile();

    if (this.adoptedKey === this.key && (this.element || this.sheetInstance)) {
      return this.element ?? this.sheetInstance;
    }

    const root = this.rootFor(target);
    if (root && root.nodeType === 11) this.adoptConstructable(root);
    else                              this.adoptElement();

    this.adoptedKey = this.key;
    this.persist();
    return this.element ?? this.sheetInstance;
  }

  // <style id> upsert. a boot.js style with the same id is reused (textContent
  // overwritten), so the pre-paint copy reconciles without duplicating.
  adoptElement () {
    this.element = setStyleElement(this.compiledCSS, { id: this.id, media: this.media ?? undefined });
    if (this.element) {
      this.element.setAttribute('data-aufbau-script', this.name);
      this.element.setAttribute('data-aufbau-hash', this.hash);
    }
    return this.element;
  }

  // constructable path: the layer is already baked into compiledCSS, so it is
  // not passed again to createStylesheet. keyed adopt engages domina's dedup.
  adoptConstructable (root) {
    this.sheetInstance = createStylesheet(this.compiledCSS, { media: this.media ?? undefined });
    adoptStylesheet(this.sheetInstance, { target: root, key: this.key });
    return this.sheetInstance;
  }

  persist () {
    this.store?.writeSheet?.(this.name, this.hash, this.compiledCSS);
    return this;
  }

  release () {
    if (this.element) {
      setStyleElement(null, { id: this.id });
      this.element = null;
    }
    this.adoptedKey = null;
    return this;
  }

  // mirrors domina's rootOf: a document or shadow root is used as is, an element
  // resolves to its own shadow root, else its containing root or the document.
  rootFor (target) {
    const fallback = typeof document !== 'undefined' ? document : null;
    if (!target) return fallback;
    if (target.nodeType === 9 || target.nodeType === 11) return target;
    return target.shadowRoot ?? target.getRootNode?.() ?? fallback;
  }
}

export default StyleSheet;
