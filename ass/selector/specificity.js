export default function specificity (node) {

  let result = {
    id:0,
    class:0,
    type:0
  };

  walk(node, result);
  return result;
}

function walk (node, result) {

  if (node.type === "id") {
    result.id++;
  }

  if (
    node.type === "class" ||
    node.type === "attribute" ||
    node.type === "pseudoClass"
  ) {
    result.class++;
  }

  if (node.type === "type") {
    result.type++;
  }

  if (node.children) {
    for (const child of node.children) {
      walk(child,result);
    }
  }

}
