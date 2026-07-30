// @classcade/compiler/parser.js

import { Lexer, buildTokenTypes, resolveRules }         from '@cosmonaut/lexer';
import { ParserState, many, map, optional, seq, token } from '@cosmonaut/parser';

// :::::: Lexer

const tokenTypes = buildTokenTypes();
const rules      = resolveRules([identifierOrDeclaration]);
const puncts     = ['!', ':'];

function tokenize (source) {
  return new Lexer(source, { 
    tokenTypes     : buildTokenTypes(),
    puncts         : ['!', ':'],
    rules          : resolveRules([identifierOrDeclaration]),
    skipWhitespace : true 
  }).tokenize();
}

// ::::::

const identifierOrDeclaration = {
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



function splitDeclaration (raw) {
  const open = raw.indexOf('[');
  return open === -1
    ? { prop: raw, value: null }
    : { prop: raw.slice(0, open), value: raw.slice(open + 1, -1) };
}





// -----------------------------------------------------------------------
// Grammatik: [ "!" ] , { IDENT ":" } , IDENT , [ BRACKET_VALUE ]
//
//   !bg[red]              -> important
//   hover:md:bg[red]       -> variants: ['hover','md']
//   block                  -> kein Wert (nur gültig, wenn später als
//                              Shorthand registriert - das prüft der
//                              Resolver, nicht der Parser)
//
// grammatik is scheisse, müsste sein:
// bg[red]!
// bg[red]:hover[blue]


const parseDeclarationTail   = map(
  token('IDENTIFIER'),
  tok => splitDeclaration(tok.value)
);
const parseVariantSegment = map(
  seq(
    token('IDENTIFIER'),
    token(':')
  ), 
  ([idToken]) => idToken.value);

const parseItem = map(
  seq(
    optional(token('!')), 
    many(variantSeg), 
    declTail
  ),
  ([bang, variants, decl]) => {
    const raw = `${bang ? '!' : ''}${variants.map(v => `${v}:`).join('')}${decl.prop}${decl.value !== null ? `[${decl.value}]` : ''}`;
    const node = { 
      type: 'decl', 
      prop: decl.prop, 
      value: decl.value, 
      important: !!bang, 
      raw 
    };
    return variants.length 
      ? { type: 'variant', variants, node, raw } 
      : node;
  },
);

const parseClassList = many(item);

export class Parser {
  parse (source) {
    const tokens = tokenize(source);
    const state  = new ParserState(tokens);
    const result = parseClassList(state);

    if (result === undefined || !state.isEOF()) {
      throw new SyntaxError(`[classcade] Failed to parse "${source}" at token ${state.index}.`);
    }
    return result;
  }
}

export default Parser;


