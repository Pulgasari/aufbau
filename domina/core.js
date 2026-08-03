// core.js

import { isElementish, isObject } from './utils.js';

export const // =========== CLONE ===========
clone = (spec, deep = true) => _el(spec)?.cloneNode(deep) ?? null;

export const // ============ GET ============
getElementById        = (id,   ctx) =>     _doc(ctx).getElementById(id),
getElement            = (spec, ctx) =>     _doc(ctx).querySelector   (_slct(spec)),
getElements           = (spec, ctx) => [..._doc(ctx).querySelectorAll(_slct(spec))],     
getElementsByDataAttr = (key,  ctx) => getElements(`[data-${key}]`,       _doc(ctx)),
getElementsByDataKey  = (key,  ctx) => getElements(`[data-key="${key}"]`, _doc(ctx));

export const // ============ MAGIC HELPERS ============
_doc  = sth => sth ? _el(sth) : document,
_root = sth => sth ? _el(sth) : $root,
_el   = sth => isElementish(sth) ? sth : getElement(_slct(sth)),

/**
 * Converts a selector string or EDO into a CSS selector.
 * Supports: tag/tagName, id, class/className, dataset/data + any other attributes.
 */
_slct = sth => {
    if (!isObject(sth)) return sth;

    // tag
    const selector = (sth.tag || sth.tagName || '').toLowerCase();

    // id
    if (sth.id) selector += '#' + sth.id;

    // class / className
    //selector += toDot(sth.class || sth.className) ?? '';
    const className = sth.class || sth.className;
    if (className) selector += '.' + String(className).trim().split(/\s+/).join('.');

    // dataset / data
    const data = sth.dataset || sth.data;
    if (data && isObject(data)) {
      for (const [k,v] of Object.entries(data)) {
        selector += `[data-${k}="${v}"]`;
      }
    }

    // remaining attributes
    const attrsToSkip = ['tag', 'tagName', 'id', 'class', 'className', 'dataset', 'data'];    
    for (const [k,v] of Object.entries(sth)) {
      if (attrsToSkip.includes(k) || null) continue;
      selector += `[${k}="${v}"]`;
    }

    return selector || '*';
};



/*
export function cls (input) {
  // Normalizes any input (String, Array, Object) into a clean string array
  toArray(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.flatMap(cls.toArray);
    if (typeof input === 'object') {
      return Object.entries(input)
        .filter(([, value]) => Boolean(value))
        .flatMap(([key]) => cls.toArray(key));
    }
    return String(input)
      .split(/[\s.]+/)
      .filter(Boolean);
  },

  // Converts to CSS selector format: ".a.b.c"
  toDot(input) {
    const list = cls.toArray(input);
    return list.length ? `.${list.join('.')}` : '';
  },

  // Converts to HTML class attribute format: "a b c"
  toSpace(input) {
    return cls.toArray(input).join(' ');
  }
};
*/

