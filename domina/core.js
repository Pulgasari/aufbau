// core.js

import { isElementish, isObject } from './utils.js';

export const // ============ GET ============
getElementById        = (id,   ctx) =>     _doc(ctx).getElementById(id),
getElement            = (spec, ctx) =>     _doc(ctx).querySelector   (_slct(spec)),
getElements           = (spec, ctx) => [..._doc(ctx).querySelectorAll(_slct(spec))],     
getElementsByDataAttr = (key,  ctx) => getElements(`[data-${key}]`,       ctx),
getElementsByDataKey  = (key,  ctx) => getElements(`[data-key="${key}"]`, ctx);


export const
_doc  = sth => sth ? _el(sth) : document,
_root = sth => sth ? _el(sth) : $root,
_el   = sth => isElementish(sth) ? sth : getElement(_slct(sth)),

/**
 * Converts a selector string or EDO into a CSS selector.
 * Supports: tag/tagName, id, class/className, dataset/data + any other attributes.
 */
_slct = sth => {
    if (!isObject(sth)) return sth;

    let selector = '';

    // tag
    if (sth.tag || sth.tagName) {
      selector += (sth.tag || sth.tagName).toLowerCase();
    }

    // id
    if (sth.id) selector += '#' + sth.id;

    // class / className
    const className = sth.class || sth.className;
    if (className) {
      selector += '.' + String(className).trim().split(/\s+/).join('.');
    }

    // dataset / data
    const data = sth.dataset || sth.data;
    if (data && isObject(data)) {
      for (const [k,v] of Object.entries(data)) {
        selector += `[data-${k}="${v}"]`;
      }
    }

    // remaining attributes
    for (const [k,v] of Object.entries(sth)) {
      if (['tag', 'tagName', 'id', 'class', 'className', 'dataset', 'data'].includes(k)) continue;
      if (v == null) continue;
      selector += `[${k}="${v}"]`;
    }

    return selector || '*';
};
