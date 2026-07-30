// classcade/parser.js

import { Lexer, buildTokenTypes, resolveRules }                        from '@cosmonaut/lexer';
import { ParserState, choice, lazy, many, map, optional, sepBy, seq, token } from '@cosmonaut/parser';
import { baseRules }                                                   from '@cosmonaut/presets';

// a value inside [...] or (...) - can itself be a nested method call,
// e.g. bg[var(--brand)] or shadow(var(--x), 2px)
const value = choice(
  map(seq(token('IDENTIFIER'), token('('), () => argList, token(')')), ([idTok, , args]) => ({
    type: 'method', id: idTok.value, args, raw: `${idTok.value}(${args.map(a=>a.raw??a).join(',')})`,
  })),
  map(token('STRING'), t => t.value.slice(1, -1)),
  map(token('NUMBER'), t => t.value),
  map(token('IDENTIFIER'), t => t.value),
);

const argList = sepBy(value, token(','));

// bg[red]           -> rule,   args from [ ]
// shadow(var(--x))  -> method, args from ( )
// block / sticky-top -> flag,  no args at all
const utility = map(
  seq(
    token('IDENTIFIER'),
    optional(choice(
      map(seq(token('['), lazy(() => argList), token(']')), ([, args]) => ({ kind: 'rule',   args })),
      map(seq(token('('), lazy(() => argList), token(')')), ([, args]) => ({ kind: 'method', args })),
      
    )),
  ),
  ([idTok, tail]) => {
    const kind = tail?.kind ?? 'rule';         // no brackets/parens at all -> plain flag rule
    const args = tail?.args ?? [];
    const raw  = kind === 'rule'
      ? (tail ? `${idTok.value}[${args.join(',')}]` : idTok.value)
      : `${idTok.value}(${args.join(',')})`;
    return { type: kind, id: idTok.value, args, raw };
  },
);

const variant = map(seq(tokenTypes.IDENTIFIER, token(':')), ([idTok]) => idTok.value);

const item = map(
  seq(optional(token('!')), many(variant), utility),
  ([important, variants, node]) => {
    const flagged = important ? { ...node, important: true } : node;
    return variants.length ? { type: 'variant', variants, node: flagged, raw: `${variants.join(':')}:${flagged.raw}` } : flagged;
  },
);

const classList = many(item);

export default class Parser {
  constructor () {}

  tokenize (source) {
    const lexer = new Lexer(source, {
      puncts : ':()[],!/.'.split(''),
      rules  : resolveRules([
        baseRules.doubleQuoteString,
        baseRules.singleQuoteString,
        baseRules.number,
        { id: 'identifier', type: tokenTypes.IDENTIFIER, regex: /[a-zA-Z_][a-zA-Z0-9_-]*/ },
      ]),
      skipWhitespace : true,
      tokenTypes     : buildTokenTypes(), 
    });
    return lexer.tokenize();
  }

  parse (source) {
    const tokens = this.tokenize(source);
    const state  = new ParserState(tokens);
    const result = classList(state);
  
    if (result === undefined || !state.isEOF()) {
      throw new SyntaxError(`[classcade] Failed to parse "${source}" at token ${state.index}.`);
    }
    return result;
  }
}


