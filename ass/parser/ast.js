// parser/ast.js

export default function createNodeAST (type, data = {}) {
  return {
    type,
    ...data
  };
}

// ==================

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

