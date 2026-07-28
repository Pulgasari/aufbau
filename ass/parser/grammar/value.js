import { any, many1, map } from "@cosmonaut/blocks";

export default function value () {

  return map(
    many1(any()),
    tokens => {

      return tokens
        .map(token => token.value)
        .join("");

    }
  );

}
