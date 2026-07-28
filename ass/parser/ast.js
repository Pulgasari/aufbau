import createNodeAST from "./NodeAST.js";

export default function createAtRuleAST (
  name,
  prelude,
  children = []
) {
  return createNodeAST(
    "atRule",
    {
      name,
      prelude,
      children
    }
  );
}
