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
        tokens.push({
          type: "BRACE_OPEN",
          value: char
        });
        index++;
        continue;
      }
      if (char === "}") {
        tokens.push({
          type: "BRACE_CLOSE",
          value: char
        });
        index++;
        continue;
      }
      if (char === ":") {
        tokens.push({
          type: "COLON",
          value: char
        });
        index++;
        continue;
      }
      if (char === ";") {
        tokens.push({
          type: "SEMICOLON",
          value: char
        });
        index++;
        continue;
      }
      if (char === "@") {
        tokens.push({
          type: "AT",
          value: char
        });
        index++;
        continue;
      }
      if (char === "#") {
        tokens.push(this.hash(input, index));
        index = tokens.at(-1).end;
        continue;
      }
      if (/[0-9.-]/.test(char)) {
        tokens.push(this.number(input, index));
        index = tokens.at(-1).end;
        continue;
      }
      if (/[a-zA-Z_-]/.test(char)) {
        tokens.push(this.identifier(input, index));
        index = tokens.at(-1).end;
        continue;
      }
      index++;
    }
    tokens.push({
      type: "EOF",
      value: null
    });
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
    return {
      type: "IDENTIFIER",
      value: input.slice(start, index),
      end: index
    };
  }
  number (input, start) {
    let index = start;
    while (
      index < input.length &&
      /[0-9.-]/.test(input[index])
    ) {
      index++;
    }
    return {
      type: "NUMBER",
      value: input.slice(start, index),
      end: index
    };
  }
  hash (input, start) {
    let index = start + 1;
    while (
      index < input.length &&
      /[a-zA-Z0-9]/.test(input[index])
    ) {
      index++;
    }
    return {
      type: "HASH",
      value: input.slice(start, index),
      end: index
    };
  }
  comment (input, start) {
    const end = input.indexOf("*/", start + 2);
    return end === -1 ? input.length : end + 2;
  }
}
