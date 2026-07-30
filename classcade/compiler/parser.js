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


// @classcade/compiler/parser.js

import { Lexer, buildTokenTypes, resolveRules }         from '@cosmonaut/lexer';
import { ParserState, many, map, optional, seq, token } from '@cosmonaut/parser';

const identOrDecl = {
  id   : 'ident-or-decl',
  type : tokenTypes.IDENTIFIER,
  match (input, pos) {
    if (!/[a-zA-Z_]/.test(input[pos])) return null;

    let i = pos;
    while (i < input.length && /[a-zA-Z0-9_-]/.test(input[i])) i++;

    // Nur wenn DIREKT (kein Leerzeichen, kein sonstiges Zeichen) ein "["
    // folgt, gehört der Klammerinhalt zum selben Token dazu.
    if (input[i] === '[') {
      let depth = 0;
      for (; i < input.length; i++) {
        if      (input[i] === '[') depth++;
        else if (input[i] === ']') { depth--; if (depth === 0) { i++; break; } }
      }
      if (depth !== 0) throw new SyntaxError(`[classcade] Unclosed bracket at position ${pos}.`);
    }

    return i - pos;
  },
};



function splitDecl (raw) {
  const open = raw.indexOf('[');
  return open === -1
    ? { prop: raw, value: null }
    : { prop: raw.slice(0, open), value: raw.slice(open + 1, -1) };
}



const tokenTypes = buildTokenTypes();

const rules  = resolveRules([identOrDecl]);
const puncts = ['!', ':'];

function tokenize (source) {
  return new Lexer(source, { tokenTypes, puncts, rules, skipWhitespace: true }).tokenize();
}

// -----------------------------------------------------------------------
// Grammatik: [ "!" ] , { IDENT ":" } , IDENT , [ BRACKET_VALUE ]
//
//   !bg[red]              -> important
//   hover:md:bg[red]       -> variants: ['hover','md']
//   block                  -> kein Wert (nur gültig, wenn später als
//                              Shorthand registriert - das prüft der
//                              Resolver, nicht der Parser)

const declTail   = map(
  token('IDENTIFIER'),
  tok => splitDecl(tok.value)
);
const variantSeg = map(
  seq(
    token('IDENTIFIER'),
    token(':')
  ), 
  ([idTok]) => idTok.value);

const item = map(
  seq(
    optional(token('!')), 
    many(variantSeg), 
    declTail
  ),
  ([bang, variants, decl]) => {
    const raw = `${bang ? '!' : ''}${variants.map(v => `${v}:`).join('')}${decl.prop}${decl.value !== null ? `[${decl.value}]` : ''}`;
    const node = { type: 'decl', prop: decl.prop, value: decl.value, important: !!bang, raw };
    return variants.length ? { type: 'variant', variants, node, raw } : node;
  },
);

const classList = many(item);

export class Parser {
  parse (source) {
    const tokens = tokenize(source);
    const state  = new ParserState(tokens);
    const result = classList(state);

    if (result === undefined || !state.isEOF()) {
      throw new SyntaxError(`[classcade] Failed to parse "${source}" at token ${state.index}.`);
    }
    return result;
  }
}

export default Parser;


