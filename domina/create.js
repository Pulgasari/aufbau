// create.js

const SVG_NS = 'http://www.w3.org/2000/svg';




export const
  createElement = (tag = 'div', props = {}, ...children) =>
    updateElement(document.createElement(tag), props, ...children),

  createSVG = (tag = 'svg', props = {}, ...children) =>
    updateElement(document.createElementNS(SVG_NS, tag), props, ...children),

  createFragment = (...nodes) => {
    const frag = document.createDocumentFragment();
    const kids = normalize(nodes);
    if (kids.length) frag.append(...kids);
    return frag;
  },

  createHTML = html => {
    const t = document.createElement('template');
    t.innerHTML = String(html).trim();
    return t.content;
  },

  createTextNode = text => document.createTextNode(String(text)),

  clone = (spec, deep = true) => {
    const el = _el(spec);
    return el ? el.cloneNode(deep) : null;
  };
