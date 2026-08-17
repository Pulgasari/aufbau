// parse ass code via cosmonaut lexer and parser
import { compileTokenizer, compileParserMethods } from '@cosmonaut/lsd';
import Parser from '@cosmonaut/parser';
import lsd    from './lsd.js';

export const createLexer = compileTokenizer     (lsd);
export const methods     = compileParserMethods (lsd);

export function parseASS (source) {
  const tokens = createLexer(source).tokenize();
  const parser = new Parser(tokens, { methods, entry: 'Sheet' });
  const ast    = parser.run();

  if (!parser.eof()) {
    const token = parser.peek();
    throw new SyntaxError( `[ass] unexpected input at ${token?.line ?? '?'}:${token?.column ?? '?'} near "${token?.value ?? ''}"` );
  }
  return ast;
}
