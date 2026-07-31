// @domina

import createElement from './createElement.js';
import getElements   from './getElements.js';
import insertElement from './insertElement.js';
import resolveEDO    from './resolveEDO.js';


export const create = (edo = {}, ...children) => {
  const { tag, tagName, ...props } = edo;
  return createElement(tag || tagName || 'div', props, ...children);
};

export const get = (edoOrSelector, context) => getElements (edoOrSelector, context);

// accepts Node, HTML string, selector, EDO or array thereof
export const insert = (sth, target = $body, mode = 'append') => insertElement (sth, target, mode);      
