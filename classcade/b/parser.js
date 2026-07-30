// classcade/parser.js
import { Lexer, buildTokenTypes, resolveRules }        from '@cosmonaut/lexer';
import { ParserState, many, map, optional, seq, token } from '@cosmonaut/parser';

const tokenTypes = buildTokenTypes();

// -----------------------------------------------------------------------
// Custom lexer rule: liest [ ... ] inklusive verschachtelter eckiger
// Klammern (z.B. grid-template-columns[[full] 1fr [full]]), OHNE den
// Inhalt zu interpretieren. Der Inhalt bleibt roher String - das ist
// Absicht, keine Lücke: classcade prüft in Schritt 1 nichts.
//
// ANNAHME: eine Lexer-Rule darf statt `regex` auch `match(input, pos)`
// haben, das die Trefferlänge ab `pos` zurückgibt (oder null). Falls euer
// @cosmonaut/lexer nur `regex` unterstützt, sag Bescheid - dann bauen wir
// stattdessen einen Pre-Scan-Pass vor dem eigentlichen Tokenizing, der
// [...]-Abschnitte vorab durch Platzhalter-Tokens ersetzt. Funktional
// identisch, nur anders verdrahtet.
const bracketValue = {
  id   : 'bracket-value',
  type : 'BRACKET_VALUE',
  match (input, pos) {
    if (input[pos] !== '[') return null;
    let depth = 0;
    for (let i = pos; i < input.length; i++) {
      if      (input[i] === '[') depth++;
      else if (input[i] === ']') { depth--; if (depth === 0) return i - pos + 1; }
    }
    throw new SyntaxError(`[classcade] Unclosed bracket starting at position ${pos}.`);
  },
};

// Bezeichner dürfen Bindestriche enthalten (padding-top, sticky-top, ...)
const identifier = {
  id    : 'identifier',
  type  : tokenTypes.IDENTIFIER,
  regex : /[a-zA-Z_][a-zA-Z0-9_-]*/,
};

const rules  = resolveRules([bracketValue, identifier]);
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

const declTail = map(
  seq(token('IDENTIFIER'), optional(token('BRACKET_VALUE'))),
  ([idTok, valTok]) => ({
    prop  : idTok.value,
    value : valTok ? valTok.value.slice(1, -1) : null, // roh, ungeparst, ungeprüft
  }),
);

const variantSeg = map(seq(token('IDENTIFIER'), token(':')), ([idTok]) => idTok.value);

const item = map(
  seq(optional(token('!')), many(variantSeg), declTail),
  ([bang, variants, decl]) => {
    const raw = `${bang ? '!' : ''}${variants.map(v => `${v}:`).join('')}${decl.prop}${decl.value !== null ? `[${decl.value}]` : ''}`;
    const node = { type: 'decl', prop: decl.prop, value: decl.value, important: !!bang, raw };
    return variants.length ? { type: 'variant', variants, node, raw } : node;
  },
);

const classList = many(item);

export default class Parser {
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
