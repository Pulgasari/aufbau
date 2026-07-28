// ass runtime semantics and evaluation engine
export class ASSEngine {
  constructor (options = {}) {
    this.options = options;
  }

  evaluate (ast) {
    if (!Array.isArray(ast)) return ast;
    return ast.map((node) => this.processNode(node));
  }

  processNode (node) {
    if (!node) return node;
    if (node.type === 'AtRule' && node.name?.value === '@scope') return this.handleScope( node );
    if (node.body && Array.isArray(node.body)) {
      return { ...node, body: node.body.map( ( child ) => this.processNode( child ) ) };
    }
    return node;
  }

  handleScope (node) {
    // custom ass scope transform logic BEFORE css emission
    return { ...node, isAssScope: true };
  }
}
