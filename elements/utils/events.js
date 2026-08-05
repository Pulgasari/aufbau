// @aufbau/elements/utils/events.js

//import { on, off } from '@aufbau/dom/events';
//import { on, off } from '@domina/events';

export const 
  
onEvent = (target, type, listener, options) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
},

offEvent = (target, type, listener, options) => {
  target.removeEventListener(type, listener, options);
  return target;
},

emitEvent = (target, eventName, detail = {}, options = {}) => {  
  return target.dispatchEvent (new CustomEvent (eventName, {
    bubbles: true, composed: true, detail, ...options
  }));
};

