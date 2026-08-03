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

  parse = (input, mimeType = 'text/html') =>
    input ? new DOMParser().parseFromString(input, mimeType) : null;

// ---------------------------------------------------------------------------
// sortElements
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// filterElements
// ---------------------------------------------------------------------------


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
