import { any, choice, many, many1, map, seq, token } from "@cosmonaut/blocks";      
import * from "./ast.js";

export default function atRule () {
  return map(
    seq(
      token("AT"),
      token("IDENTIFIER"),
      many(rule())
    ),
    ([, name, children]) => {
      return createAtRuleAST(
        name.value,
        "",
        children
      );
    }
  );
}

export default function declaration () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("COLON"),
      value(),
      token("SEMICOLON")
    ),
    ([property, , value]) => {
      return createDeclarationAST(
        property.value,
        value
      );
    }
  );
}

export default function rule () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("BRACE_OPEN"),
      many(declaration()),
      token("BRACE_CLOSE")
    ),
    ([selector, , children]) => {
      return createRuleAST(
        selector.value,
        children
      );
    }
  );
}

export default function stylesheet () {
  return map(
    many(rule()),
    rules => {
      return {
        type: "stylesheet",
        children: rules
      };
    }
  );
}

export default function value () {
  return map(
    many1(
      choice(
        token("VALUE"),
        token("IDENTIFIER"),
        token("CHAR")
      )
    ),
    tokens => {
      return tokens
        .map(token => token.value)
        .join("");
    }
  );
}
