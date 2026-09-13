// @aufbau/ass/transform.js
// resolves the four ass constructs against the parsed tree and returns a plain
// css node tree (rule / decl / atrule, with nested rules kept for the
// serializer to flatten). value resolution is lookup-then-passthrough, so any
// ordinary css that defines no token is emitted unchanged (ass is a superset).
//
// constructs:
//   @default <props> { name: value }   named values, scoped to props (+ longhands)
//   @prop    <prop>  { name: value }    named values, scoped to a single prop
//   @mixin   <name>  { ... }            reusable block; also any ".name" rule
//   use: .name                          inlines a mixin's body in place
//   @value <value> : <props>            reversed declaration

import { LONGHANDS } from './longhands.js';

const splitList = str => str.split(',').map(s => s.trim()).filter(Boolean);

// only a bare single class selector (".vert") doubles as a mixin
const classMixinName = selector => (/^\.[-\w]+$/.test(selector.trim()) ? selector.trim().slice(1) : null);

function expandProps (props) {
  const out = [];
  for (const prop of props) {
    out.push(prop);
    if (LONGHANDS[prop]) out.push(...LONGHANDS[prop]);
  }
  return out;
}

function define (registry, props, declNodes) {
  for (const prop of props) {
    let map = registry.get(prop);
    if (!map) registry.set(prop, map = new Map);
    for (const child of declNodes) {
      if (child.type === 'decl') map.set(child.prop, child.value);
    }
  }
}

function registerMixin (mixins, rawName, nodes) {
  const name = rawName[0] === '.' ? rawName.slice(1) : rawName;
  if (name) mixins.set(name, nodes);
}

// definitions are file scoped: the whole tree is collected before anything is
// applied, so declaration order relative to usage does not matter.
function collect (nodes, ctx) {
  for (const node of nodes) {
    if (node.type === 'atrule') {
           if (node.name === '@default') define(ctx.registry, expandProps(splitList(node.params)), node.nodes);
      else if (node.name === '@prop')    define(ctx.registry, splitList(node.params), node.nodes);
      else if (node.name === '@mixin')   registerMixin(ctx.mixins, node.params.trim(), node.nodes);
    } else if (node.type === 'rule') {
      const name = classMixinName(node.selector);
      if (name) registerMixin(ctx.mixins, name, node.nodes);
    }
  }
}

// a single bare token can be a token name; multi-token values pass through
function resolveValue (prop, value, registry) {
  if (/\s/.test(value)) return value;
  const map = registry.get(prop);
  return map && map.has(value) ? map.get(value) : value;
}

const resolveDecl = (node, registry) => ({ type: 'decl', prop: node.prop, value: resolveValue(node.prop, node.value, registry) });

const expandValue = (node, registry) => node.props.map(prop => ({ type: 'decl', prop, value: resolveValue(prop, node.value, registry) }));

function useMixins (value, ctx) {
  const out = [];
  for (const raw of value.split(/[\s,]+/).filter(Boolean)) {
    const name = raw[0] === '.' ? raw.slice(1) : raw;
    const body = ctx.mixins.get(name);
    if (!body || ctx.seen.has(name)) continue; // unknown or cyclic: drop the use
    ctx.seen.add(name);
    out.push(...applyBody(body, ctx));
    ctx.seen.delete(name);
  }
  return out;
}

// body of a rule: declarations, @value expansions, use-inlining, nested rules
function applyBody (nodes, ctx) {
  const out = [];
  for (const node of nodes) {
    switch (node.type) {
      case 'decl'   : node.prop === 'use' ? out.push(...useMixins(node.value, ctx)) : out.push(resolveDecl(node, ctx.registry)); break;
      case 'value'  : out.push(...expandValue(node, ctx.registry)); break;
      case 'rule'   : out.push({ type: 'rule', selector: node.selector, nodes: applyBody(node.nodes, ctx) }); break;
      case 'atrule' : out.push(node.nodes ? { ...node, nodes: applyBody(node.nodes, ctx) } : node); break;
    }
  }
  return out;
}

function apply (nodes, ctx) {
  const out = [];
  for (const node of nodes) {
    if (node.type === 'atrule') {
      // definition at-rules emit nothing; everything else passes through
      if (node.name === '@default' || node.name === '@prop' || node.name === '@mixin') continue;
      out.push(node.nodes ? { ...node, nodes: apply(node.nodes, ctx) } : node);
    } else if (node.type === 'rule') {
      out.push({ type: 'rule', selector: node.selector, nodes: applyBody(node.nodes, ctx) });
    } else if (node.type === 'decl') {
      out.push(resolveDecl(node, ctx.registry));
    } else if (node.type === 'value') {
      out.push(...expandValue(node, ctx.registry));
    }
  }
  return out;
}

export function transform (nodes) {
  const ctx = { registry: new Map, mixins: new Map, seen: new Set };
  collect(nodes, ctx);
  return apply(nodes, ctx);
}

export default transform;
