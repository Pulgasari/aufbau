import { many, map } from "@cosmonaut/blocks";

import rule from "./rule.js";

export default function stylesheet () {
  return map(
    many(rule()),
    rules => {
      return {
        type: "stylesheet",
        children: rules
      };
    }
  );
}
