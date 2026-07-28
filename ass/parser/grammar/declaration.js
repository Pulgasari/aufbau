import { map, seq, token } from "@cosmonaut/blocks";
import value from "./value.js";
import {
  createDeclarationAST
} from "../ast/DeclarationAST.js";

export default function declaration () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("COLON"),
      value(),
      token("SEMICOLON")
    ),
    ([property, , value]) => ({
      return createDeclarationAST(
        property.value,
        value
      );
    })
  );
}
