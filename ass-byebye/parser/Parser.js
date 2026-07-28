import Tokenizer   from "./Tokenizer.js";
import TokenStream from "./TokenStream.js";

export default class Parser {
  #ass;
  #tokenizer
  
  constructor (ass) {
    this.#ass       = ass;
    this.#tokenizer = new Tokenizer();
  }
  parse (css) {
    const tokens = this.#tokenizer.tokenize(css);
    const stream = new TokenStream(tokens);
    const ast    = this.parseStylesheet(stream);
    
    return this.#ass.import(ast);
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
