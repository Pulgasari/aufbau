import CSSRenderer from "./renderer/CSSRenderer.js";
import EventEmitter from "./core/EventEmitter.js";
import Scheduler    from "./core/Scheduler.js";
import SheetNode    from "./nodes/SheetNode.js";

export default class ASS {
  #events;
  #scheduler;
  #sheet;
  constructor () {
    this.#events    = new EventEmitter();
    this.#scheduler = new Scheduler(() => { this.render(); });
    this.#renderer  = new CSSRenderer();
    this.#sheet     = new SheetNode(this);
  }
  get sheet () {
    return this.#sheet;
  }
  get events () {
    return this.#events;
  }
  rule (selector) {
    return this.#sheet.rule(selector);
  }
  layer (name) {
    return this.#sheet.layer(name);
  }
  media (query) {
    return this.#sheet.media(query);
  }
  prop (name, value) {
    return this.#sheet.prop(name, value);
  }
  dirty () {
    this.#scheduler.queue();
  }
  render () {
    this.#sheet.clean();
    this.#events.emit("render", this);
  }
  toCSS () {
    return this.#renderer.render(this.#sheet);
  }
}
