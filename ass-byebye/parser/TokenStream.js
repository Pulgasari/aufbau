export default class TokenStream {

  tokens;

  index = 0;

  constructor (tokens) {
    this.tokens = tokens;
  }

  current () {
    return this.tokens[this.index];
  }

  next () {
    return this.tokens[this.index++];
  }

  save () {
    return this.index;
  }

  restore (index) {
    this.index = index;
  }

  eof () {
    return this.current().type === "EOF";
  }

}
