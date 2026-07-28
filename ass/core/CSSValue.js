export default class CSSValue {
  constructor (raw, type = null) {
    this.raw = raw;
    this.type = type;
  }
  toString () {
    return this.raw;
  }
}
