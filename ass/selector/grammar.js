import { choice,  map, seq, token } from "@cosmonaut/blocks";
import * from "./ast.js";

export default function simple () {
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
