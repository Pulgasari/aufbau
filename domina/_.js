// domina/index.js

// ---------------------------------------------------------------------------
// Magic Helpers
// ---------------------------------------------------------------------------
export let
  

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
