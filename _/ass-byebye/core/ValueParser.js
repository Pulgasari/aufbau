import CSSValue from "./CSSValue.js";

export default class ValueParser {
  parse (value, definition = null) {
    if (value instanceof CSSValue) {
      return value;
    }
    const raw = this.format(value, definition);
    const type = this.detect(raw);
    return new CSSValue(raw, type);
  }
  format (value, definition) {
    if (
      typeof value === "number" &&
      definition?.config.unit
    ) {
      return `${value}${definition.config.unit}`;
    }
    return String(value);
  }
  detect (value) {
    if (/^-?\d*\.?\d+(px|rem|em|%|vh|vw)$/.test(value)) {
      return "length";
    }
    if (/^-?\d*\.?\d+(ms|s)$/.test(value)) {
      return "time";
    }
    if (/^#([0-9a-f]{3,8})$/i.test(value)) {
      return "color";
    }
    if (/^rgba?\(/.test(value)) {
      return "color";
    }
    if (/^-?\d*\.?\d+$/.test(value)) {
      return "number";
    }
    return "unknown";
  }
}
