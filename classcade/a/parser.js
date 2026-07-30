// classcade/parser.js

// Top-level auf sep splitten, aber Klammertiefe [ ] ( ) respektieren,
// damit z.B. "calc(5px + 2px)" oder "ld(white black)" nicht zerschnitten wird.
function splitTopLevel (str, sep) {
  const parts = [];
  let depth = 0, start = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '[' || ch === '(') depth++;
    else if (ch === ']' || ch === ')') depth--;
    else if (ch === sep && depth === 0) { parts.push(str.slice(start, i)); start = i + 1; }
  }
  parts.push(str.slice(start));
  return parts;
}

function splitItems (source) {
  const items = [];
  let depth = 0, start = 0;
  const s = source.trim();

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '[' || ch === '(') depth++;
    else if (ch === ']' || ch === ')') depth--;
    else if (/\s/.test(ch) && depth === 0) {
      if (i > start) items.push(s.slice(start, i));
      start = i + 1;
    }
  }
  if (start < s.length) items.push(s.slice(start));
  return items;
}

// "padding-top[calc(5px + 2px)]" -> { prop: "padding-top", value: "calc(5px + 2px)" }
// "block"                        -> { prop: "block",       value: null }
// respektiert verschachtelte [ ], z.B. grid-template-columns[[full] 1fr [full]]
function splitBracket (tail) {
  const open = tail.indexOf('[');
  if (open === -1) return { prop: tail, value: null };

  let depth = 0, close = -1;
  for (let i = open; i < tail.length; i++) {
    if (tail[i] === '[') depth++;
    else if (tail[i] === ']') { depth--; if (depth === 0) { close = i; break; } }
  }
  if (close === -1) throw new SyntaxError(`[classcade] Unclosed bracket in "${tail}"`);

  return { prop: tail.slice(0, open), value: tail.slice(open + 1, close) };
}

function parseItem (item) {
  let rest = item;
  let important = false;
  if (rest.startsWith('!')) { important = true; rest = rest.slice(1); }

  const segments = splitTopLevel(rest, ':');
  const tail     = segments.pop();
  const variants = segments;

  const { prop, value } = splitBracket(tail);
  const node = { type: 'decl', prop, value, important, raw: item };

  return variants.length ? { type: 'variant', variants, node, raw: item } : node;
}

export default class Parser {
  parse (source) {
    return splitItems(source).map(parseItem);
  }
}
