// ass runtime semantics and evaluation engine

export class ASSEngine {
  constructor ( options = {} ) {
    this.options = options;
  }

  evaluate ( ast ) {
    if ( !Array.isArray( ast ) ) return ast;
    return this.flattenStatements( ast );
  }

  flattenStatements ( statements, parentSelector = '' ) {
    const result = [];
    for ( const node of statements ) {
      if ( !node ) continue;
      if ( node.type === 'Rule' ) {
        result.push( ...this.processRule( node, parentSelector ) );
      } else if ( node.type === 'AtRule' ) {
        result.push( this.processAtRule( node, parentSelector ) );
      } else {
        result.push( node );
      }
    }
    return result;
  }

  processRule ( node, parentSelector = '' ) {
    const rawSel = Array.isArray( node.selector ) ? node.selector.map( ( s ) => s.value ).join( '' ) : ( node.selector?.value || '' );
    const fullSel = combineSelectors( parentSelector, rawSel );

    const decls = [];
    const nestedNodes = [];

    for ( const child of ( node.body || [] ) ) {
      if ( child.type === 'Declaration' ) decls.push( child );
      else nestedNodes.push( child );
    }

    const currentRule = { ...node, selector: fullSel, body: decls };
    const flattened = [ currentRule ];

    if ( nestedNodes.length > 0 ) {
      flattened.push( ...this.flattenStatements( nestedNodes, fullSel ) );
    }

    return flattened;
  }

  processAtRule ( node, parentSelector = '' ) {
    if ( node.name?.value === '@scope' ) return this.handleScope( node );
    if ( node.body && Array.isArray( node.body ) ) {
      return { ...node, body: this.flattenStatements( node.body, parentSelector ) };
    }
    return node;
  }

  handleScope ( node ) {
    return { ...node, isAssScope: true };
  }
}

function combineSelectors ( parent, child ) {
  if ( !parent ) return child;
  if ( child.includes( '&' ) ) return child.replaceAll( '&', parent );
  return `${parent} ${child}`;
}
