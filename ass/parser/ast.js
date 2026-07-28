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

export default function createDeclarationAST (
  property,
  value
) {
  return createNodeAST(
    "declaration",
    {
      property,
      value
    }
  );
}
