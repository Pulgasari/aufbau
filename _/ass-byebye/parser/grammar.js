import { any, choice, many, many1, map, seq, token } from "@cosmonaut/blocks";      
import * from "./ast.js";

export function atRule () {
  return map(
    seq(
      token("AT"),
      token("IDENTIFIER"),
      many(rule())
    ),
    ([, name, children]) => createAtRuleAST (name.value, "", children)
  );
}

export function declaration () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("COLON"),
      value(),
      token("SEMICOLON")
    ),
    ([property, , value]) => createDeclarationAST (property.value, value)
  );
}

export function rule () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("BRACE_OPEN"),
      many(declaration()),
      token("BRACE_CLOSE")
    ),
    ([selector, , children]) => createRuleAST (selector.value, children)
  );
}

export function stylesheet () {
  return map(
    many(
      choice(
        rule(),
        atRule()
      )
    ),
    children => ({ type: "stylesheet", children })
  );
}

export function value () {
  return map(
    many1(
      choice(
        token("VALUE"),
        token("IDENTIFIER"),
        token("CHAR")
      )
    ),
    tokens => tokens.map(token => token.value).join("")
  );
}
