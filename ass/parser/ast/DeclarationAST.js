import createNodeAST from "./NodeAST.js";

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
