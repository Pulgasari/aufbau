// parser/ast.js

export function createNodeAST (type, data = {}) {
  return {type, ...data };
}

export function createAtRuleAST (name, prelude, children = [)) {
  return createNodeAST("atRule",{ name, prelude, children });
}

export function createDeclarationAST (property, value) {
  return createNodeAST("declaration", { property, value });
}

export function createRuleAST (selector, children) {
  return createNodeAST("rule", { selector, children });
}

