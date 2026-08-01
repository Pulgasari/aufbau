// utils.js

export const

isArray      = Array.isArray;
isString     = v => typeof v === 'string';
isFn         = v => typeof v === 'function';
isNullish    = v => v == null;
isObject     = v => v !== null && typeof v === 'object';
isFragment   = v => v instanceof DocumentFragment;
isElementish = v =>
  v instanceof Element ||
  v instanceof DocumentFragment ||
  v instanceof Document,

isDate   = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!isNaN(Date.parse(v)) && isNaN(Number(v))),
isEDO    = v => isObject(v) && (v.tag || v.tagName),
isEmpty  = v => v === '' || v === null || v === undefined,
isHTML   = v => isString(v) && v.trim().startsWith('<'),
isIdLike = v => v.charCodeAt(0) === 35 && v.indexOf(' ') === -1 && v.indexOf('.') === -1,
isDings  = el => el.type === 'checkbox' || el.type === 'radio',
isMulti  = el => el.tagName === 'SELECT' && el.multiple,
isURL    = v => isString(v) && v.includes('://'),

_doc  = sth => sth ? _el(sth) : document,
_el   = sth => isElementish(sth) ? sth : getElement(_slct(sth)),
_root = sth => sth ? _el(sth) : $root,

/**
 * Converts a selector string or EDO into a CSS selector.
 * Supports: tag/tagName, id, class/className, dataset/data + any other attributes.
 */
_slct = sth => {
    if (!isObject(sth)) return sth;

    let sel = '';

    // tag
    if (sth.tag || sth.tagName) {
      sel += (sth.tag || sth.tagName).toLowerCase();
    }

    // id
    if (sth.id) sel += '#' + sth.id;

    // class / className
    const cls = sth.class || sth.className;
    if (cls) {
      sel += '.' + String(cls).trim().split(/\s+/).join('.');
    }

    // dataset / data
    const data = sth.dataset || sth.data;
    if (data && isObject(data)) {
      for (const [k, v] of Object.entries(data)) {
        sel += `[data-${k}="${v}"]`;
      }
    }

    // remaining attributes
    for (const [k, v] of Object.entries(sth)) {
      if (['tag', 'tagName', 'id', 'class', 'className', 'dataset', 'data'].includes(k)) continue;
      if (v == null) continue;
      sel += `[${k}="${v}"]`;
    }

    return sel || '*';
};
