// @domina/observer.js

import { $body, $root, getElements } from './dom.js';
import { arrayfied } from './util.js';

//----- INTERNAL SHORTHANDS
let
IO = (callback, options) => new IntersectionObserver (callback, options),
MO = (callback)          => new     MutationObserver (callback),
PO = (callback)          => new  PerformanceObserver (callback),
RO = (callback)          => new       ResizeObserver (callback),
clst = { childList: true, subtree: true },

//----- INTERNAL HELPERS
noop = () => {},
_disconnect = (...observers) => observers.forEach( observer => observer?.disconnect() ),
observe = ( observer, scope=document, options ) => observer.observe( scope, options || {childList: true, subtree: true} ),
ensureBody = callback => {
  if (document.body) return callback();
  let observer = MO(() => document.body && (observer.disconnect(), callback()) );
  observe(observer, $root);
},
traverseNodes = ({ nodes, selector='*', callback }) => {
  arrayfied(nodes)?.forEach( node => {
    if (node.nodeType === 1) { // Element nodes only
      if (node.matches(selector)) callback(node); // on self
      node.querySelectorAll(selector)?.forEach(callback); // on children
    }
  });
},
// Cleaners
asDisposer = stopCallback => {
  let active = true;
  return () => { if (active) { active = false; try { stopCallback() } catch {} } };
},
asDisconnecter = (...observer) => asDisposer(() => _disconnect(...observer));

//////////////////// EXPORTS ////////////////////

export let
// ===== MUTATIONS OBSERVER =====
onConnected    = (node, callback) => {
  if (!node) return noop;
  if (node.isConnected) { callback(node); return noop; }

  let observer, start = () => {
    observer = MO(() => { if (node.isConnected) try { callback(node) } finally { observer.disconnect() }});
    observe(observer, document);
  };
  ensureBody(start);
  return asDisconnecter(observer);
},
onDisconnected = (node, callback) => {
  if (!node) return noop;
  if (!node.isConnected) { callback(node); return noop; }

  let observer = null, arm = () => {
    let parent = node.parentNode;
    if (!parent) return;
    observer = MO( mutations => {
      for (let { removedNodes } of mutations)
      for (let removed of removedNodes)
      if (removed === node || removed.contains?.(node)) {
        try     { callback(node); } 
        finally { observer.disconnect(); }
        return;
      }
    });
    observe(observer, parent);
  };

  arm();
  let rearmObserver = MO(() => {
         if (!node.isConnected)     { callback(node); _disconnect( observer, rearmObserver ); }
    else if (observer?.takeRecords) { /* no-op */ }
    else                            { observer?.disconnect(); arm(); }
  });
  observe(rearmObserver, document);
  return asDisconnecter( observer, rearmObserver );
},
onceConnected  = (node, callback) => onConnected(node, callback), // onConnected(node, n => callback(n))
observeLifecycle = (node, { connected, disconnected } = {}) => {
  let stops = [];
  if    (connected) stops.push(   onConnected(node,    connected));
  if (disconnected) stops.push(onDisconnected(node, disconnected));
  return asDisposer(() => stops.forEach(stop => stop()));
},
// Child Nodes
onChildListChange = (node, callback) => {
  if (!node) return noop;
  let observer = MO( mutations => {
    for (let { target, addedNodes, removedNodes } of mutations)
    callback({ target, addedNodes, removedNodes });
  });
  observer.observe(node, { childList: true });
  return asDisconnecter(observer);
},
onChildAdded      = (node, callback) => onChildListChange(node, ({   addedNodes }) =>   addedNodes.forEach(callback)),
onChildRemoved    = (node, callback) => onChildListChange(node, ({ removedNodes }) => removedNodes.forEach(callback)),
// Attributes
onAttributeChange = (node, attrName, callback, { withOldValue = false } = {}) => {
  if (!node) return noop;
  let observer = MO( mutations => {
    for (let { attributeName, oldValue, type } of mutations)
    if (type === 'attributes' && attributeName === attrName)
    callback(node, node.getAttribute(attrName), withOldValue ? oldValue : undefined);
  });
  observer.observe(node, { attributes: true, attributeFilter: [attrName], attributeOldValue: withOldValue });
  return asDisconnecter(observer);
},
onceAttributeChange = (node, attrName, callback) => {
  let stop = onAttributeChange(node, attrName, (...args) => { stop(); callback(...args); }, { withOldValue: true });
  return stop;
},
watchAttributes = (node, callback) => {
  if (!node) return noop;
  let observer = MO( mutations => {
    for (let { attributeName, oldValue, type } of mutations)
    if (type === 'attributes') callback(node, attributeName, node.getAttribute(attributeName), oldValue);
  });
  observer.observe(node, { attributes: true, attributeOldValue: true });
  return asDisconnecter(observer);
},
// Document
observeDocument = callback => {
  let observer = MO(callback);
  ensureBody(() => observe(observer, document.body));
  return asDisconnecter(observer);
},
watch = (selector, { onAdd, onRemove }) => {
  // init
  ensureBody(() => getElements(selector).forEach( element => onAdd?.(element) ));
  //
  let observer = MO( mutations => {
    for (let { addedNodes, removedNodes } of mutations) {
      if    (onAdd) traverseNodes({ nodes:   addedNodes, selector, callback: onAdd    });
      if (onRemove) traverseNodes({ nodes: removedNodes, selector, callback: onRemove });
    }
  });
  //
  ensureBody(() => observe(observer, document.body));
  return asDisconnecter(observer);
},

// ===== INTERSECT OBSERVER =====
// Visibility / Intersect
onIntersect = (node, callback, options) => {
  if (!node) return noop;
  let observer = IO( items => items.forEach(callback), options);
  observer.observe(node);
  return asDisconnecter(observer);
},
onceIntersect = (node, callback, options) => {
  let stop = onIntersect(node, entry => entry.isIntersecting && (stop(), callback(entry)), options);
  return stop;
},

// ===== RESIZE OBSERVER =====
// Resizing
onResize = (node, callback) => {
  if (!node) return noop;
  let observer = RO( items => items.forEach(callback) );
  observer.observe(node);
  return asDisconnecter(observer);
},

// Aliases
onRemoved = onDisconnected;
