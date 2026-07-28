import { map, seq, token } from "@cosmonaut/blocks";
import {
  createDeclarationAST
} from "../ast/DeclarationAST.js";

export default function declaration () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("COLON"),
      token("IDENTIFIER")
    ),
    ([property, , value]) => ({
      return createDeclarationAST(
        property.value,
        value.value
      );
    })
  );
}
