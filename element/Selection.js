// one or more nodes. the host and everything selected through it share this api.
//
// a selection made with a selector is live: it is found again whenever it is
// used, so it survives a render. its listeners sit on the trees it was searched
// in and check at event time whether the target belongs to it.
// every listener ends with the signal of its context, i.e. when the host disconnects

import { isFn, isPlainObject, isString } from '@pulgasari/is';

// events that do not bubble reach a live selection only while capturing
const NOT_BUBBLING = new Set(['blur', 'cancel', 'close', 'error', 'focus', 'load', 'mouseenter', 'mouseleave', 'pointerenter', 'pointerleave', 'scroll', 'toggle']);

const SHORTHANDS = {
  onBlur        : 'blur',
  onChange      : 'change',
  onClick       : 'click',
  onFocus       : 'focus',
  onInput       : 'input',
  onKeyDown     : 'keydown',
  onPointerDown : 'pointerdown',
  onSubmit      : 'submit',
};

const treesOf  = node => node.shadowRoot ? [node.shadowRoot, node] : [node];
const within   = (parent, node) => parent !== node && (parent.contains?.(node) || Boolean(parent.shadowRoot?.contains(node)));
const typesOf  = types => isString(types) ? types.split(/\s+/).filter(Boolean) : [...types];
const isTarget = value => value != null && !isString(value) && isFn(value.addEventListener);

function toNodes (target) {
  if (target == null) return [];
  if (isTarget(target)) return [target];
  return [...target].filter(isTarget);
}

export class Selection {
  // context: { owner, signal }. roots: the trees a live selection listens on, null for fixed nodes.
  // accepts() gives the test an event target has to pass, once per event
  constructor (resolve, context, roots = null, accepts = null) {
    this.resolve = resolve;
    this.context = context;
    this.roots   = roots;
    this.accepts = accepts ?? (() => { const nodes = this.nodes; return node => nodes.includes(node); });
  }

  static of (nodes, context) { return new Selection(() => nodes, context); }

  get nodes () { return this.resolve(); }
  get node  () { return this.nodes[0] ?? null; }
  get size  () { return this.nodes.length; }

  [Symbol.iterator] () { return this.nodes[Symbol.iterator](); }

  // :::::: FINDING

  // a selector searches, a node, window or a list of nodes is taken as it is
  $ (target) {
    if (!isString(target)) return Selection.of(toNodes(target), this.context);

    return this.live(() => {
      for (const node of this.nodes) {
        for (const tree of treesOf(node)) {
          const found = tree.querySelector(target);
          if (found) return [found];
        }
      }
      return [];
    });
  }

  // its listeners test a target with matches() instead of searching the trees.
  // matches() reads :scope as the node itself, so such a selector searches
  $$ (selector) {
    const resolve = () => this.nodes.flatMap(node => treesOf(node).flatMap(tree => [...tree.querySelectorAll(selector)]));
    if (selector.includes(':scope')) return this.live(resolve);

    const accepts = () => {
      const parents = this.nodes;
      return node => node.matches?.(selector) && parents.some(parent => within(parent, node));
    };
    return this.live(resolve, accepts);
  }

  part  (name) { return this.$(`[part~="${name}"]`); }
  parts (name) { return this.$$(`[part~="${name}"]`); }

  live (resolve, accepts) { return new Selection(resolve, this.context, this.roots ?? this.nodes.flatMap(treesOf), accepts); }

  filter   (test) { return Selection.of(this.nodes.filter(test), this.context); }
  find     (test) { return this.nodes.find(test) ?? null; }
  includes (node) { return this.nodes.includes(node); }
  matches  (selector) { return this.nodes.some(node => node.matches?.(selector)); }

  // the same nodes, their listeners also end with this signal
  until (signal) {
    const context = { ...this.context, signal: AbortSignal.any([this.context.signal, signal]) };
    return new Selection(this.resolve, context, this.roots, this.accepts);
  }

  // :::::: EVENTS

  // on(types, handler, options) or on(types, selector, handler, options).
  // types: 'click' or 'dragenter dragover'. the handler is called on the owner with (event, node)
  on (types, ...args) {
    if (isString(args[0])) return this.$$(args[0]).on(types, ...args.slice(1)), this;

    const [handler, options = {}] = args;
    const { owner, signal } = this.context;
    const call = (event, node) => handler.call(owner, event, node);

    for (const type of typesOf(types)) {
      const settings = { capture: Boolean(this.roots) && NOT_BUBBLING.has(type), ...options, signal };

      if (!this.roots) {
        for (const node of this.nodes) node.addEventListener(type, event => call(event, node), settings);
        continue;
      }

      // an event can pass the shadow root and the host: each serves the nodes of its own tree
      const listener = event => {
        const found = event.composedPath().find(this.accepts());
        if (found && event.currentTarget.contains(found)) call(event, found);
      };
      for (const root of this.roots) root.addEventListener(type, listener, settings);
    }

    return this;
  }

  // false when a listener prevented the default
  emit (type, detail = null, { bubbles = true, cancelable = true, composed = false } = {}) {
    let allowed = true;
    for (const node of this.nodes) {
      if (!node.dispatchEvent(new CustomEvent(type, { bubbles, cancelable, composed, detail }))) allowed = false;
    }
    return allowed;
  }

  // :::::: CHANGING

  // attr('label') reads the first, attr({ open: true, label: false }) writes all, false and null remove
  attr (name) {
    if (!isPlainObject(name)) return this.node?.getAttribute(name) ?? null;

    for (const node of this.nodes) {
      for (const [key, value] of Object.entries(name)) {
        if (value === false || value == null) node.removeAttribute(key);
        else node.setAttribute(key, value === true ? '' : String(value));
      }
    }
    return this;
  }

  // text() reads the first, text('x') writes all
  text (value) {
    if (value === undefined) return this.node?.textContent ?? '';
    for (const node of this.nodes) node.textContent = value;
    return this;
  }

  focus (options) { this.node?.focus(options); return this; }
}

for (const [name, type] of Object.entries(SHORTHANDS)) {
  Selection.prototype[name] = function (handler, options) { return this.on(type, handler, options); };
}

export { SHORTHANDS };
