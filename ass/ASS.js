// ass

import CascadeEngine    from "./cascade/CascadeEngine.js";
import CSSRenderer      from "./renderer/CSSRenderer.js";
import EventEmitter     from "./core/EventEmitter.js";
import Scheduler        from "./core/Scheduler.js";
import SheetNode        from "./nodes/SheetNode.js";
import Parser           from "./parser/Parser.js";
import PropertyRegistry from "./registries/PropertyRegistry.js";
import ValueParser      from "./core/ValueParser.js";

export default class ASS {
  #cascade;
  #events;
  #parser;
  #properties;
  #renderer;
  #scheduler;
  #selectorParser;
  #sheet;
  #values;
  
  constructor () {
    this.#cascade    = new CascadeEngine();
    this.#events     = new EventEmitter();
    this.#scheduler  = new Scheduler(() => { this.render(); });
    this.#parser     = new Parser(this);
    this.#properties = new PropertyRegistry(this);
    this.#renderer   = new CSSRenderer();
    this.#sheet      = new SheetNode(this);
    this.#values     = new ValueParser();
  }
  
  get sheet  () { return this.#sheet;  }
  get events () { return this.#events; }
  
  dirty () { this.#scheduler.queue(); }

  compute  (element)     { return this.#cascade.compute(this.#sheet, element); }
  rule     (selector)    { return this.#sheet.rule(selector); }
  layer    (name)        { return this.#sheet.layer(name); }
  media    (query)       { return this.#sheet.media(query); }
  prop     (name, value) { return this.#sheet.prop(name, value); }
  property (name)        { return this.#properties.resolve(name); }
  selector (value)       { return this.#selectorParser.parse(value); }

  props (definitions) {
    for (const [name, config] of Object.entries(definitions)) {
      this.#properties.register(name, config);
    }
    return this;
  }
  render () {
    this.#sheet.clean();
    this.#events.emit("render", this);
  }
  toCSS () {
    return this.#renderer.render(this.#sheet);
  }
  parseValue (value, definition) {
    return this.#values.parse(value, definition);
  }
  load (source) {
    switch (source.type) {
      case "text"       : this.#parser.parse          (source.value); break;
      case "node"       : this.#parser.fromNode       (source.value); break;
      case "stylesheet" : this.#parser.fromStyleSheet (source.value); break;       
      case "url"        : this.#parser.fromURL        (source.value); break;
    }
    return this;
  }
}
