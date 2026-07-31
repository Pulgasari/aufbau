// domina/index.js

// ---------------------------------------------------------------------------
// Internal type checks
// ---------------------------------------------------------------------------
const isArray      = Array.isArray;
const isString     = v => typeof v === 'string';
const isFn         = v => typeof v === 'function';
const isNullish    = v => v == null;
const isObject     = v => v !== null && typeof v === 'object';
const isFragment   = v => v instanceof DocumentFragment;
const isElementish = v =>
  v instanceof Element ||
  v instanceof DocumentFragment ||
  v instanceof Document;

// ---------------------------------------------------------------------------
// Main Elements References
// ---------------------------------------------------------------------------
export let
  $app  = document.getElementById('app'),
  $body = document.body,
  $head = document.head,
  $root = document.documentElement;

// ---------------------------------------------------------------------------
// Domain-specific checks
// ---------------------------------------------------------------------------
let
  isDate   = v => /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.test(v) || (!isNaN(Date.parse(v)) && isNaN(Number(v))),
  isEDO    = v => isObject(v) && (v.tag || v.tagName),
  isEmpty  = v => v === '' || v === null || v === undefined,
  isHTML   = v => isString(v) && v.trim().startsWith('<'),
  isIdLike = v => v.charCodeAt(0) === 35 && v.indexOf(' ') === -1 && v.indexOf('.') === -1,
  isDings  = el => el.type === 'checkbox' || el.type === 'radio',
  isMulti  = el => el.tagName === 'SELECT' && el.multiple,
  isURL    = v => isString(v) && v.includes('://');

// ---------------------------------------------------------------------------
// Magic Helpers
// ---------------------------------------------------------------------------
export let
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
  },

  /**
   * Resolves almost anything into a Node / DocumentFragment.
   * Accepts: Element, DocumentFragment, HTML string, EDO, selector, …
   */
  toNode = (sth) => {
    if (isElementish(sth)) return sth;
    if (isHTML(sth))       return createFragment2(sth);
    if (isEDO(sth))        return create(sth);
    return _el(sth);
  };

// ---------------------------------------------------------------------------
// Low-level: get
// ---------------------------------------------------------------------------
export let
  getElementById        = selector            => document.getElementById(selector),
  getElement            = (selector, context) => _doc(context).querySelector(_slct(selector)),
  getElements           = (selector, context) => [..._doc(context).querySelectorAll(_slct(selector))],
  getElementsByDataAttr = (key, parent)       => getElements(`[data-${key}]`, parent),
  getElementsByDataKey  = (key, parent)       => getElements(`[data-key="${key}"]`, parent),

// ---------------------------------------------------------------------------
// Low-level: create (strict signature)
// ---------------------------------------------------------------------------
  createElement = (tag = 'div', props = {}, ...children) => {
    const el = document.createElement(tag);
    updateElement(el, props, ...children);
    return el;
  },

  createFragment   = ()  => document.createDocumentFragment(),
  createFragment2  = sth => document.createRange().createContextualFragment(sth),
  createTextNode   = text => document.createTextNode(String(text)),
  createStylesheet = sth => createElement('style', isString(sth) ? { textContent: sth } : sth),

// ---------------------------------------------------------------------------
// Low-level: insert
// ---------------------------------------------------------------------------
  insertElement = (sth, target = $body, mode = 'append') => {
    // Bulk support: array of mixed items → single DocumentFragment
    if (isArray(sth)) {
      const frag = document.createDocumentFragment();
      for (const item of sth) {
        const node = toNode(item);
        if (node) frag.append(node);
      }
      sth = frag;
    }

    const el = toNode(sth);

    let result = el;
    if (isFragment(el)) {
      result = el.childNodes.length === 1
        ? el.childNodes[0]
        : [...el.childNodes];
    }

    mode = {
      after       : 'after',
      afterbegin  : 'prepend',
      afterend    : 'after',
      before      : 'before',
      beforebegin : 'before',
      prepend     : 'prepend',
    }[mode] || 'append';

    if (el) _el(target)?.[mode](el);
    return result;
  },

// ---------------------------------------------------------------------------
// Low-level: update / remove
// ---------------------------------------------------------------------------
  updateElement = (el, props = {}, ...children) => {
    el = _el(el);
    if (!el) return false;

    // Apply props
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') {
        Object.assign(el.style, value);
      } else if (key === 'dataset' || key === 'data') {
        Object.assign(el.dataset, value);
      } else if (key.startsWith('on') && isFn(value)) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key in el) {
        el[key] = value;
      } else {
        el.setAttribute(key, value);
      }
    }

    // Append children – use DocumentFragment when there are multiple nodes
    if (children.length === 1) {
      el.append(children[0]);
    } else if (children.length > 1) {
      const frag = document.createDocumentFragment();
      for (const child of children) {
        if (isArray(child)) child.forEach(c => frag.append(c));
        else frag.append(child);
      }
      el.append(frag);
    }
  },

  updateTitle   = str => (document.title = str),
  clearElement  = sth => _el(sth) && (_el(sth).innerHTML = ''),
  removeElement = sth => _el(sth)?.remove();

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------
export let
  getValue = (node, mode = null) => {
    const el = _el(node);
    if (!el) return null;

    let value = isDings(el)   ? el.checked
              : isMulti(el)   ? Array.from(el.selectedOptions).map(o => o.value)
              : 'value' in el ? el.value
              : el.textContent || el.innerText || '';

    return {
      bool   : Boolean(value),
      date   : new Date(value),
      number : parseFloat(value) || 0,
      string : String(value),
    }[mode] ?? value;
  },

  setValue = (node, value) => {
    const el = _el(node);
    if (!el) return null;

    // Checkboxes & Radios
    if (isDings(el)) {
      el.checked = Boolean(value);
    }
    // Multi-select
    else if (isMulti(el)) {
      const values = isArray(value) ? value.map(String) : [String(value)];
      Array.from(el.options).forEach(opt => {
        opt.selected = values.includes(opt.value);
      });
    }
    // Standard form elements
    else if ('value' in el) {
      el.value = (value instanceof Date && el.type === 'date')
        ? value.toISOString().split('T')[0]
        : value;
    }
    // Non-form elements
    else {
      el.textContent = value;
    }
  },

  parse = (input, mimeType = 'text/html') =>
    input ? new DOMParser().parseFromString(input, mimeType) : null;

// ---------------------------------------------------------------------------
// sortElements
// ---------------------------------------------------------------------------
const sortModes = {
  regular: (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }),
  num:     (a, b) => parseFloat(a) - parseFloat(b),
  date:    (a, b) => {
    const parseDate = (v) => {
      const m = String(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      return m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date(v);
    };
    return parseDate(a) - parseDate(b);
  },
  auto: (a, b) => (isDate(a) && isDate(b)) ? sortModes.date(a, b) : sortModes.regular(a, b),
};

export function sortElements({ container, item, indicators }) {
  const $container = getElement(container);
  if (!$container) {
    console.warn(`Container "${container}" not found.`);
    return;
  }

  const items = getElements(item, $container);
  const defaultOrder = 'auto-asc';

  // Normalize indicator specs
  const specs = [].concat(indicators).map(spec => {
    if (isString(spec)) return { selector: spec, order: defaultOrder };
    if (isArray(spec))  return { selector: spec[0], order: spec[1] || defaultOrder };
    return { order: defaultOrder, ...spec };
  });

  items.sort((a, b) => {
    for (const { selector, order } of specs) {
      const valA = a.querySelector(selector)?.textContent.trim() || '';
      const valB = b.querySelector(selector)?.textContent.trim() || '';

      let result = 0;

      if (order === 'random') {
        result = Math.random() - 0.5;
      } else if (isFn(order)) {
        result = order(valA, valB);
      } else {
        const [mode, direction] = order.includes('-')
          ? order.split('-')
          : ['auto', order];

        const strategy = sortModes[mode] || sortModes.auto;
        result = strategy(valA, valB);
        if (direction === 'desc') result *= -1;
      }

      if (result !== 0) return result;
    }
    return 0;
  });

  // Re-append in new order via DocumentFragment
  const frag = document.createDocumentFragment();
  items.forEach(el => frag.append(el));
  $container.append(frag);
}

// ---------------------------------------------------------------------------
// filterElements
// ---------------------------------------------------------------------------
const parseVal = (v) => {
  const m = String(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  if (!isNaN(Date.parse(v)) && isNaN(Number(v))) return new Date(v);
  return v;
};

const stringFilter = (fn) => (value, search) =>
  String(value ?? '').toLowerCase()[fn](String(search).toLowerCase());

const filterModes = {
  // String
  contains   : stringFilter('includes'),
  includes   : stringFilter('includes'),
  startsWith : stringFilter('startsWith'),
  endsWith   : stringFilter('endsWith'),
  exact      : (value, search) => String(value).toLowerCase() === String(search).toLowerCase(),

  // Numeric
  'num-eq' : (value, search) => parseFloat(value) === parseFloat(search),
  'num-gt' : (value, search) => parseFloat(value)  >  parseFloat(search),
  'num-lt' : (value, search) => parseFloat(value)  <  parseFloat(search),

  // Date
  'date-eq'     : (value, search) => {
    const d1 = parseVal(value), d2 = parseVal(search);
    return d1 instanceof Date && d2 instanceof Date && d1.getTime() === d2.getTime();
  },
  'date-after'  : (value, search) => {
    const d1 = parseVal(value), d2 = parseVal(search);
    return d1 instanceof Date && d2 instanceof Date && d1 > d2;
  },
  'date-before' : (value, search) => {
    const d1 = parseVal(value), d2 = parseVal(search);
    return d1 instanceof Date && d2 instanceof Date && d1 < d2;
  },
};

export function filterElements({
  container,
  item,
  filters,
  mismatchClass = 'hidden',
}) {
  const $container = _el(container);
  if (!$container) {
    console.warn('Container not found.');
    return;
  }

  const items = getElements(item, $container);

  // Normalize filter specs
  const specs = [].concat(filters).map(spec => {
    if (isFn(spec))   return { customFn: spec };
    if (isArray(spec)) return { selector: spec[0], value: spec[1], mode: spec[2] || 'contains' };
    return { mode: 'contains', ...spec };
  });

  items.forEach(el => {
    let matches = true;

    for (const { selector, value, mode, customFn } of specs) {
      if (isEmpty(value) && !customFn) continue;

      const target    = selector ? getElement(selector, el) : el;
      const itemValue = getValue(target) ?? '';

      let result = false;

      if (isFn(customFn)) {
        result = customFn(itemValue, value, el);
      } else {
        const strategy = filterModes[mode] || filterModes.contains;
        result = strategy(itemValue, value);
      }

      if (!result) {
        matches = false;
        break; // AND logic
      }
    }

    el.classList.toggle(mismatchClass, !matches);
  });
}

// ---------------------------------------------------------------------------
// High-level API (EDO-friendly)
// ---------------------------------------------------------------------------
export let
  /**
   * Create element from EDO
   * create({ tag: 'div', className: 'box', textContent: 'Hi' })
   */
  create = (edo = {}, ...children) => {
    const { tag, tagName, ...props } = edo;
    return createElement(tag || tagName || 'div', props, ...children);
  },

  /**
   * Query elements – accepts CSS selector string OR EDO
   * get({ tag: 'div', dataset: { key: 'bla' } })
   * get('.item')
   */
  get = (edoOrSelector, context) => getElements(edoOrSelector, context),

  /**
   * Insert – accepts Node, HTML string, selector, EDO or array thereof
   */
  insert = (sth, target = $body, mode = 'append') => insertElement(sth, target, mode);
