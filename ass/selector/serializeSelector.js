export default function serializeSelector (node) {
  switch (node.type) {
    case "complex"       : return node.children.map(serializeSelector).join("");
    case "compound"      : return node.children.map(serializeSelector).join("");
    case "type"          : return node.value;
    case "class"         : return `.${node.value}`;
    case "id"            : return `#${node.value}`;
    case "pseudoClass"   : return `:${node.name}`;
    case "pseudoElement" : return `::${node.name}`;
    case "attribute"     : return `[${node.name}]`;
    case "combinator"    : return ` ${node.value} `;
  }
  return "";
}
