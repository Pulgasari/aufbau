// classcade/lexer.js
import { Lexer, buildTokenTypes, resolveRules } from '@cosmonaut/lexer';
import { baseRules } from '@cosmonaut/presets';

export const tokenTypes = buildTokenTypes();

const puncts = [':', '(', ')', '[', ']', ',', '!', '/', '.'];

// bindestrich gehört zum namen dazu -> "sticky-top" ist EIN token
const identifier = {
  id: 'identifier',
  type: tokenTypes.IDENTIFIER,
  regex: /[a-zA-Z_][a-zA-Z0-9_-]*/,
};

const rules = resolveRules([
  baseRules.doubleQuoteString,
  baseRules.singleQuoteString,
  baseRules.number,
  identifier,
]);

export function createClasscadeLexer (source) {
  return new Lexer(source, { tokenTypes, puncts, rules, skipWhitespace: true });
}
