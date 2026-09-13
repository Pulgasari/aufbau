// @aufbau/ass/parse.js
// hand written, comment- and string-aware scanner. produces a small plain node
// tree; no external parser toolchain, so the same code runs unchanged in a
// browser worker and in a build step.
//
// node shapes:
//   { type: 'rule',   selector, nodes }       selector { ... }
//   { type: 'atrule', name, params, nodes }   @name params { ... }   (nodes null when statement-form)
//   { type: 'decl',   prop, value }           prop: value;
//   { type: 'value',  value, props }          @value value : prop... ;

// index just past a closing quote, honoring backslash escapes.
function readString (code, i) {
  const quote = code[i++];
  while (i < code.length) {
    if (code[i] === '\\')  { i += 2; continue; }
    if (code[i] === quote) return i + 1;
    i++;
  }
  return i;
}

// index just past the matching ')', honoring nested parens, strings and
// comments. url(), calc() etc. are copied verbatim so their inner ; : { } never
// act as delimiters.
function readParen (code, i) {
  let depth = 0;
  while (i < code.length) {
    const c = code[i];
         if (c === '"' || c === "'")            { i = readString(code, i); continue; }
    else if (c === '/' && code[i + 1] === '*')  { const e = code.indexOf('*/', i + 2); i = e === -1 ? code.length : e + 2; continue; }
    else if (c === '(')                         depth++;
    else if (c === ')')                         { if (--depth === 0) return i + 1; }
    i++;
  }
  return i;
}

// first ':' not inside a string or paren group. used to split declarations and
// the @value head.
function topLevelColon (text) {
  let i = 0;
  while (i < text.length) {
    const c = text[i];
         if (c === '"' || c === "'") { i = readString(text, i); continue; }
    else if (c === '(')             { i = readParen(text, i);  continue; }
    else if (c === ':')             return i;
    i++;
  }
  return -1;
}

// @value <value> : <prop> <prop> ... -> reversed declaration node
function makeValue (rest) {
  const colon = topLevelColon(rest);
  if (colon === -1) return null;
  const value = rest.slice(0, colon).trim();
  const props = rest.slice(colon + 1).trim().split(/[\s,]+/).filter(Boolean);
  return props.length ? { type: 'value', value, props } : null;
}

// a ';'- or '}'-terminated statement: declaration, @value, or a pass-through
// statement at-rule (@import etc.).
function makeStatement (head) {
  const text = head.trim();
  if (!text) return null;

  if (text[0] === '@') {
    const sp   = text.search(/\s/);
    const name = sp === -1 ? text : text.slice(0, sp);
    if (name === '@value') return makeValue(text.slice(sp + 1));
    return { type: 'atrule', name, params: sp === -1 ? '' : text.slice(sp + 1).trim(), nodes: null };
  }

  const colon = topLevelColon(text);
  if (colon === -1) return null; // not a declaration, ignore
  return { type: 'decl', prop: text.slice(0, colon).trim(), value: text.slice(colon + 1).trim() };
}

// a '{'-terminated head is a prelude: an at-rule header or a selector.
function makeBlock (head, children) {
  const prelude = head.trim();
  if (prelude[0] === '@') {
    const sp = prelude.search(/\s/);
    return { type: 'atrule', name: sp === -1 ? prelude : prelude.slice(0, sp), params: sp === -1 ? '' : prelude.slice(sp + 1).trim(), nodes: children };
  }
  return { type: 'rule', selector: prelude, nodes: children };
}

// scans a block body (or the whole source at top level) from `i`, stopping at
// the matching '}' or end of input. returns [nodes, indexAfterBlock].
function parseNodes (code, i) {
  const nodes = [];
  const len   = code.length;
  let   head  = ''; // accumulates the current prelude/statement text

  while (i < len) {
    const c = code[i];

    if (c === '/' && code[i + 1] === '*') { const e = code.indexOf('*/', i + 2); i = e === -1 ? len : e + 2; continue; }
    if (c === '/' && code[i + 1] === '/') { const e = code.indexOf('\n',  i + 2); i = e === -1 ? len : e + 1; continue; }

    // strings and paren groups are copied verbatim so their inner delimiters are inert
    if (c === '"' || c === "'") { const j = readString(code, i); head += code.slice(i, j); i = j; continue; }
    if (c === '(')              { const j = readParen(code, i);  head += code.slice(i, j); i = j; continue; }

    if (c === '{') {
      const [children, next] = parseNodes(code, i + 1);
      nodes.push(makeBlock(head, children));
      head = '';
      i    = next;
      continue;
    }

    if (c === ';') {
      const node = makeStatement(head);
      if (node) nodes.push(node);
      head = '';
      i++;
      continue;
    }

    if (c === '}') {
      const node = makeStatement(head); // tolerate a missing trailing ';'
      if (node) nodes.push(node);
      return [nodes, i + 1];
    }

    head += c;
    i++;
  }

  const node = makeStatement(head); // top-level leftover
  if (node) nodes.push(node);
  return [nodes, i];
}

export function parse (source) {
  return parseNodes(String(source), 0)[0];
}

export default parse;
