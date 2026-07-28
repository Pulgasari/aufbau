import { many, many1, map, seq, token } from "@cosmonaut/blocks";

import value from "./value.js";

import createDeclarationAST from "../ast/DeclarationAST.js";
import createRuleAST from "../ast/RuleAST.js";

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
