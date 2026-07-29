// index.js

export { Classcade } from "./classcade.js";

export function create (options = {}) {
  return new Classcade (options);
}
