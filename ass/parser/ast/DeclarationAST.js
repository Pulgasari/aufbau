export function createDeclarationAST (property, value) {

  return {
    type: "declaration",
    property,
    value
  };

}
