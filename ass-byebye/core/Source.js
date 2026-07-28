export default class Source {
  type;
  value;
  constructor (type, value) {
    this.type  = type;
    this.value = value;
  }
  static normalize (input) {
    if (!input) {
      return new Source("empty", null);
    }
    if (typeof input === "object") {
      if ("text" in input) return new Source("text", input.text);
      if ("url"  in input) return new Source("url",  input.url);
      if ("node" in input) return new Source("node", input.node);
    }
    if (typeof input === "string") {
      if (
        input.includes("{") ||
        input.includes(":")
      ) {
        return new Source("text", input);
      }
      if (
        input.startsWith("http") ||
        input.endsWith(".css")
      ) {
        return new Source("url", input);
      }
      console.error(
        "ASS: Invalid source input. CSS selector strings are not sources."
      );
      return new Source("empty", null);
    }
    if (input instanceof CSSStyleSheet) {
      return new Source("stylesheet", input);
    }
    if (input instanceof Element) {
      return new Source("node", input);
    }
    return new Source("empty", null);
  }
}
