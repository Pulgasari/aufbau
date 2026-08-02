// update.js

import { _el } from './utils.js';
import { isArray, isFn, isString } from './utils.js';

// null / undefined / false raus, Arrays platt – für Children überall gleich
const normalize = nodes => nodes.flat(Infinity).filter(n => n != null && n !== false);

export const

updateElement = (spec, props = {}, ...children) => {
  const element = _el(spec); if (!element) return null;

  // SVG-Elemente haben read-only Props (className, href) -> immer setAttribute
  const isSVG = element instanceof SVGElement;

  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;

    if (key === 'style') {
      if (isString(value)) element.setAttribute('style', value);
      else for (const [p, v] of Object.entries(value))
        p.includes('-') ? element.style.setProperty(p, v) : (element.style[p] = v);
    }
      
    else if (key === 'dataset' || key === 'data') {
      Object.assign(element.dataset, value);
    }
      
    else if (key === 'class' || key === 'className') {
      element.setAttribute('class', 
        isArray(value)
        ? value.flat(Infinity).filter(Boolean).join(' ')
        : value
      );
    }
      
    else if (key.startsWith('on') && isFn(value)) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    }
      
    else if (!isSVG && key in element) {
      element[key] = value;
    }
      
    else {
      element.setAttribute(key, value);
    }
  }

  const kids = normalize(children);
  if (kids.length) element.append(...kids);

  return element;
};

// @domina/updateElement.js

export const updateElement2 = (spec, props = {}, ...children) => {
  
  const el = _el(spec); if (!el) return false;

  // apply props
  for (const [key, value] of Object.entries(props)) {

      key ==='style
    ? Object.assign(el.style, value)
        
    : (key === 'dataset' || key === 'data')
    ? Object.assign(el.dataset, value)
        
    : (key.startsWith('on') && isFn(value))
    ? el.addEventListener(key.slice(2).toLowerCase(), value)
        
    : (key in el)
    ? el[key] = value
        
    : el.setAttribute(key, value);
  
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
  
};


