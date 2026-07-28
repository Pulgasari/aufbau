export function createRuleAST (selector, children = []) {

  return {
    type: "rule",
    selector,
    children
  };

}
