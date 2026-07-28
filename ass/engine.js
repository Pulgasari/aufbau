// ass runtime semantics and evaluation engine

export class ASSEngine {
  constructor ( options = {} ) {
    this.options = options;
    this.traits = new Map();
  }

  evaluate ( ast ) {
    if ( !Array.isArray( ast ) ) return ast;
    this.traits.clear();
    this.collectTraits( ast );
    return this.flattenStatements( ast );
  }

  collectTraits ( statements ) {
    for ( const node of statements ) {
      if ( !node ) continue;
      if ( node.type === 'AtRule' && node.name?.value === '@trait' ) {
        const name = node.params ? node.params.map( ( p ) => p.value ).join( '' ) : '';
        if ( name ) {
          this.traits.set( name, node.body || [] );
          if ( name.startsWith( '.' ) ) this.traits.set( name.slice( 1 ), node.body || [] );
        }
      }
      if ( node.body && Array.isArray( node.body ) ) this.collectTraits( node.body );
    }
  }

  flattenStatements ( statements, parentSelector = '' ) {
    const result = [];
    for ( const node of statements ) {
      if ( !node ) continue;
      if ( node.type === 'AtRule' && node.name?.value === '@trait' ) {
        const name = node.params ? node.params.map( ( p ) => p.value ).join( '' ) : '';
        if ( name.startsWith( '.' ) ) {
          const implicitRule = { type: 'Rule', selector: name, body: node.body || [] };
          result.push( ...this.processRule( implicitRule, parentSelector ) );
        }
        continue;
      }
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
      if ( child.type === 'Declaration' ) {
        if ( child.name?.value === 'use' ) this.applyTraits( child, decls, nestedNodes );
        else decls.push( child );
      } else {
        nestedNodes.push( child );
      }
    }

    const currentRule = { ...node, selector: fullSel, body: decls };
    const flattened = [ currentRule ];

    if ( nestedNodes.length > 0 ) {
      flattened.push( ...this.flattenStatements( nestedNodes, fullSel ) );
    }

    return flattened;
  }

  applyTraits ( useDecl, decls, nestedNodes ) {
    const rawValues = Array.isArray( useDecl.value ) ? useDecl.value.map( ( v ) => v.value ) : [ useDecl.value?.value || '' ];
    for ( const traitName of rawValues ) {
      if ( !traitName || traitName === ';' ) continue;
      const traitBody = this.traits.get( traitName );
      if ( !traitBody ) continue;

      for ( const item of traitBody ) {
        if ( item.type === 'Declaration' ) decls.push( item );
        else nestedNodes.push( item );
      }
    }
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
  return `${parent}${child}`;
}
