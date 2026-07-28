import { many, map, seq, token } from "@cosmonaut/blocks";
import declaration from "./declaration.js";
import {
  createRuleAST
} from "../ast/RuleAST.js";

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
