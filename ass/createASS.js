import ASS    from "./ASS.js";
import Source from "./core/Source.js";

export default function createASS (input) {
  const ass = new ASS();
  const source = Source.normalize(input);
  ass.load(source);
  return ass;
}
