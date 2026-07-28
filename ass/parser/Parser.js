export default class Parser {
  #ass;
  constructor (ass) {
    this.#ass = ass;
  }
  parse (css) {
    console.log("parse css", css);
    return this.#ass;
  }
  fromNode (node) {
    if (node.tagName === "STYLE") {
      return this.parse(node.textContent);
    }
    return this.#ass;
  }
  fromStyleSheet (sheet) {
    for (const rule of sheet.cssRules) {
      console.log(rule);
    }
    return this.#ass;
  }
  async fromURL (url) {
    const response = await fetch(url);
    const css = await response.text();
    return this.parse(css);
  }
}
