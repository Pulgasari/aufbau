import { many, map, seq, token } from "@cosmonaut/blocks";

import rule from "./rule.js";
import value from "./value.js";

import createDeclarationAST from "../ast/DeclarationAST.js";

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
