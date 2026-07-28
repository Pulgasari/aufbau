import { any, choice, many1, map, token } from "@cosmonaut/blocks";

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
