// @domina

import * from './utils.js';

import sortElements  from './sortElements.js';
import updateElement from './updateElement.js';

/*
import createElement from './createElement.js';
import getElements   from './getElements.js';
import insertElement from './insertElement.js';
import resolveEDO    from './resolveEDO.js';
*/

export const 
// ============ CREATE ============

create = (edo = {}, ...children) => {
  const { tag, tagName, ...props } = edo;
  const what = tag || tagName || 'div';
  return createElement (what, props, ...children);
},
  
createElement = (tag = 'div', props = {}, ...children) => {
  const el = document.createElement(tag);
  updateElement(el, props, ...children);
  return el;
};


export default {
  createElement,
  getElement,
  getElements,
  insertElement,
  sortElements,
  updateElement,
  
  element  : getElement,
  elements : getElements,
}


/*

aufbau.get({ id: 'app-header' })
aufbau.get('#app-header')

aufbau.dom.get({ id: 'app-header' })
aufbau.dom.get('#app-header'

domina.get({ id: 'app-header' })
domina.get('#app-header')

dom.get({ id: 'app-header' })
dom.get('#app-header')

dom.element({ id: 'app-header' })
dom.element('#app-header')

dom.elements({ dataKey: 'app-header' })
dom.elements('#app-header')

aufbau.dom.element({ id: 'app-header' })
aufbau.dom.element('#app-header')

*/











