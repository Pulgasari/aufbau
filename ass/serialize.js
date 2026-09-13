// @aufbau/ass/serialize.js
// flattens the resolved tree to plain css. nested rules are combined with their
// parent selector instead of relying on native css nesting, so the output works
// on the oldest webviews the apps target.

// splits a selector list on top-level commas, honoring () and [] groups
function splitSelectorList (selector) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
         if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) { out.push(selector.slice(start, i).trim()); start = i + 1; }
  }
  out.push(selector.slice(start).trim());
  return out.filter(Boolean);
}

// combines a nested selector with its parent: '&' is substituted, otherwise the
// child is joined as a descendant. a leading combinator ('> *') is preserved by
// the plain space join, giving "parent > *".
function combine (parent, child) {
  const out = [];
  for (const p of splitSelectorList(parent)) {
    for (const c of splitSelectorList(child)) {
      out.push(c.includes('&') ? c.replace(/&/g, p) : `${p} ${c}`);
    }
  }
  return out.join(', ');
}

function emitRule (node, parentSelector, chunks, indent) {
  const selector = parentSelector ? combine(parentSelector, node.selector) : node.selector;
  const decls    = node.nodes.filter(n => n.type === 'decl');
  const nested   = node.nodes.filter(n => n.type === 'rule');
  const atrules  = node.nodes.filter(n => n.type === 'atrule');

  if (decls.length) {
    const body = decls.map(d => `${indent}${d.prop}: ${d.value};`).join('\n');
    chunks.push(`${selector} {\n${body}\n}`);
  }

  for (const child of nested) emitRule(child, selector, chunks, indent);
  for (const at of atrules)   emitAtrule(at, chunks, indent);
}

function emitAtrule (node, chunks, indent) {
  if (!node.nodes) { chunks.push(node.params ? `${node.name} ${node.params};` : `${node.name};`); return; }

  const inner = [];
  for (const child of node.nodes) emitTop(child, inner, indent);
  const body = inner.join('\n\n').split('\n').map(line => (line ? indent + line : line)).join('\n');
  chunks.push(`${node.name}${node.params ? ' ' + node.params : ''} {\n${body}\n}`);
}

function emitTop (node, chunks, indent) {
       if (node.type === 'rule')   emitRule(node, null, chunks, indent);
  else if (node.type === 'atrule') emitAtrule(node, chunks, indent);
}

export function serialize (nodes, options = {}) {
  const indent = options.indent ?? '  ';
  const chunks = [];
  for (const node of nodes) emitTop(node, chunks, indent);
  return chunks.join('\n\n');
}

export default serialize;
