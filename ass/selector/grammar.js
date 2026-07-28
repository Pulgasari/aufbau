import { choice,  map, optional, seq, token } from "@cosmonaut/blocks";
import * from "./ast.js";

export function pseudoClass () {
  return map(
    seq(
      token("COLON"),
      token("IDENTIFIER"),
      optional(
        token("PAREN_OPEN")
      )
    ),
    ([, name]) => createSelector ("pseudoClass", { name: name.value });
  );
}

export function simple () {
  return choice(
    map(
      token("IDENTIFIER"),
      token => SimpleSelector(
        "type",
        token.value
      )
    ),
    map(
      seq(
        token("CLASS"),
        token("IDENTIFIER")
      ),
      ([, token]) => SimpleSelector(
        "class",
        token.value
      )
    ),
    map(
      seq(
        token("ID"),
        token("IDENTIFIER")
      ),
      ([, token]) => SimpleSelector(
        "id",
        token.value
      )
    )
  );
}

