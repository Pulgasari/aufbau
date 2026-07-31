export default class Token {
  constructor (type, value, start, end) {
    this.type  = type;
    this.value = value;
    this.start = start;
    this.end   = end;
  }
}
