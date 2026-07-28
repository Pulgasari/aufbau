import { many, map, seq, token } from "@cosmonaut/blocks";
import declaration from "./declaration.js";

export default function rule () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("BRACE_OPEN"),
      many(declaration()),
      token("BRACE_CLOSE")
    ),
    ([selector, , declarations]) => ({
      type     : "rule",
      selector : selector.value,
      children : declarations
    })
  );
}
