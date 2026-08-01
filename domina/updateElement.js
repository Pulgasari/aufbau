// @domina/updateElement.js

import * from './utils.js';

export const updateElement = (spec, props = {}, ...children) => {
  
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

export default updateElement;
