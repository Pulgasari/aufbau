import Token from "./../parser/Token.js";

export default class SelectorTokenizer {
  tokenize (input) {
    const tokens = [];
    let index = 0;
    while (index < input.length) {
      const char = input[index];
      if (/\s/.test(char)) {
        index++;
        continue;
      }
      if (char === ".") {
        tokens.push(
          new Token(
            "CLASS",
            char,
            index,
            ++index
          )
        );
        continue;
      }
      if (char === "#") {
        tokens.push(
          new Token(
            "ID",
            char,
            index,
            ++index
          )
        );
        continue;
      }
      if (char === ":") {
        if (input[index + 1] === ":") {
          tokens.push(
            new Token(
              "DOUBLE_COLON",
              "::",
              index,
              index + 2
            )
          );
          index += 2;
          continue;
        }
        tokens.push(
          new Token(
            "COLON",
            char,
            index,
            ++index
          )
        );
        continue;
      }
      if (
        char === ">" ||
        char === "+" ||
        char === "~"
      ) {
        tokens.push(
          new Token(
            "COMBINATOR",
            char,
            index,
            ++index
          )
        );
        continue;
      }
      if (char === "*") {
        tokens.push(
          new Token(
            "STAR",
            char,
            index,
            ++index
          )
        );
        continue;
      }
      if (/[a-zA-Z_-]/.test(char)) {
        const start = index;
        while (
          index < input.length &&
          /[a-zA-Z0-9_-]/.test(input[index])
        ) {
          index++;
        }
        tokens.push(
          new Token(
            "IDENTIFIER",
            input.slice(start, index),
            start,
            index
          )
        );
        continue;
      }
      index++;
    }
    tokens.push(
      new Token(
        "EOF",
        null,
        index,
        index
      )
    );
    return tokens;
  }

}
