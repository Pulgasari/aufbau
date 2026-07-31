export default class Scheduler {
  #scheduled = false;
  #callback;

  constructor (callback) {
    this.#callback = callback;
  }

  queue () {
    if (this.#scheduled) {
      return;
    }

    this.#scheduled = true;

    queueMicrotask(() => {
      this.#scheduled = false;
      this.#callback();
    });

  }

}
