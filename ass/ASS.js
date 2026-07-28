import EventEmitter from "./core/EventEmitter.js";
import Scheduler    from "./core/Scheduler.js";
import SheetNode    from "./nodes/SheetNode.js";

export default class ASS {

  #events;
  #scheduler;
  #sheet;

  constructor () {
    this.#events = new EventEmitter();
    this.#scheduler = new Scheduler(() => {
      this.render();
    });
    this.#sheet = new SheetNode(this);
  }

  get sheet  () { return this.#sheet; }
  get events () { return this.#events; }

  dirty () {
    this.#scheduler.queue();
    return this;
  }

  render () {
    this.#sheet.clean();
    this.#events.emit("render", this);
  }

}
