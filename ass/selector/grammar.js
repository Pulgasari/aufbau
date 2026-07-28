import { choice, many1, map, optional, seq, token } from "@cosmonaut/blocks";
import * from "./ast.js";

export default function attribute () {
  return map(
    seq(
      token("BRACKET_OPEN"),
      token("IDENTIFIER"),
      token("BRACKET_CLOSE")
    ),
    ([, name]) => createSelector ("attribute", { name:name.value });
  );
}

export function compound () {
  return map(
    many1(
      choice(
        pseudoElement(),
        pseudoClass(),
        attribute(),
        simple()
      )
    ),
    children => ({ type:"compound", children })
  );
}

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

export default function pseudoElement () {
  return map(
    seq(
      token("DOUBLE_COLON"),
      token("IDENTIFIER")
    ),
    ([, name]) => createSelector ("pseudoElement", { name:name.value });  
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

