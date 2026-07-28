import { map, seq, token } from "@cosmonaut/blocks";

export default function declaration () {
  return map(
    seq(
      token("IDENTIFIER"),
      token("COLON"),
      token("IDENTIFIER")
    ),
    ([property, , value]) => ({
      type     : "declaration",
      property : property.value,
      value    : value.value
    })
  );
}
