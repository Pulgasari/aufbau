import createNodeAST from "./NodeAST.js";

export default function createRuleAST (
  selector,
  children
) {
  return createNodeAST(
    "rule",
    {
      selector,
      children
    }
  );
}
