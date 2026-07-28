import Token from "./Token.js";

export default class Tokenizer {
  tokenize (input) {
    const tokens = [];
    let index = 0;
    while (index < input.length) {
      const char = input[index];
      if (/\s/.test(char)) {
        index++;
        continue;
      }
      if (input.startsWith("/*", index)) {
        index = this.comment(input, index);
        continue;
      }
      if (char === "{") {
        tokens.push(new Token("BRACE_OPEN", char, index, ++index));
        continue;
      }
      if (char === "}") {
        tokens.push(new Token("BRACE_CLOSE", char, index, ++index));
        continue;
      }
      if (char === ":") {
        tokens.push(new Token("COLON", char, index, ++index));
        continue;
      }
      if (char === ";") {
        tokens.push(new Token("SEMICOLON", char, index, ++index));
        continue;
      }
      if (char === "@") {
        tokens.push(new Token("AT", char, index, ++index));
        continue;
      }
      if (char === "#") {
        const token = this.hash(input, index);
        tokens.push(token);
        index = token.end;
        continue;
      }
      if (/[0-9.-]/.test(char)) {
        const token = this.number(input, index);
        tokens.push(token);
        index = token.end;
        continue;
      }
      if (/[a-zA-Z_-]/.test(char)) {
        const token = this.identifier(input, index);
        tokens.push(token);
        index = token.end;
        continue;
      }
      tokens.push(
        new Token("CHAR", char, index, ++index)
      );
    }
    tokens.push(
      new Token("EOF", null, index, index)
    );
    return tokens;
  }
  identifier (input, start) {
    let index = start;
    while (
      index < input.length &&
      /[a-zA-Z0-9_-]/.test(input[index])
    ) {
      index++;
    }
    return new Token(
      "IDENTIFIER",
      input.slice(start, index),
      start,
      index
    );
  }
  number (input, start) {
    let index = start;
    while (
      index < input.length &&
      /[0-9a-zA-Z.%_-]/.test(input[index])
    ) {
      index++;
    }
    return new Token(
      "VALUE",
      input.slice(start, index),
      start,
      index
    );
  }
  hash (input, start) {
    let index = start + 1;
    while (
      index < input.length &&
      /[a-zA-Z0-9]/.test(input[index])
    ) {
      index++;
    }
    return new Token(
      "VALUE",
      input.slice(start, index),
      start,
      index
    );
  }
  comment (input, start) {
    const end = input.indexOf("*/", start + 2);
    return end === -1 ? input.length : end + 2;
  }
}
