// ass runtime semantics and evaluation engine

export class ASSEngine {
  constructor ( options = {} ) {
    this.options = options;
    this.traits = new Map();
    this.tokens = new Map();
  }

  evaluate ( ast ) {
    if ( !Array.isArray( ast ) ) return ast;
    this.traits.clear();
    this.tokens.clear();
    this.collectDefinitions( ast );
    return this.flattenStatements( ast );
  }

  collectDefinitions ( statements ) {
    for ( const node of statements ) {
      if ( !node ) continue;
      if ( node.type === 'AtRule' ) {
        if ( node.name?.value === '@trait' ) this.registerTrait( node );
        if ( node.name?.value === '@tokens' ) this.registerTokens( node );
      }
      if ( node.body && Array.isArray( node.body ) ) this.collectDefinitions( node.body );
    }
  }

  registerTrait ( node ) {
    const name = node.params ? node.params.map( ( p ) => p.value ).join( '' ) : '';
    if ( !name ) return;
    this.traits.set( name, node.body || [] );
    if ( name.startsWith( '.' ) ) this.traits.set( name.slice( 1 ), node.body || [] );
  }

  registerTokens ( node ) {
    const targetProps = ( node.params || [] ).map( ( p ) => p.value ).join( '' ).split( ',' ).map( ( s ) => s.trim() ).filter( Boolean );
    const tokenMap = new Map();

    for ( const item of ( node.body || [] ) ) {
      if ( item.type === 'Declaration' && item.name?.value ) {
        const valStr = Array.isArray( item.value ) ? item.value.map( ( v ) => v.value ).join( ' ' ) : ( item.value?.value || '' );
        tokenMap.set( item.name.value, valStr );
      }
    }

    for ( const prop of targetProps ) {
      this.tokens.set( prop, tokenMap );
    }
  }

  flattenStatements ( statements, parentSelector = '' ) {
    const result = [];
    for ( const node of statements ) {
      if ( !node ) continue;
      if ( node.type === 'AtRule' && ( node.name?.value === '@trait' || node.name?.value === '@tokens' ) ) {
        if ( node.name?.value === '@trait' && node.params ) {
          const name = node.params.map( ( p ) => p.value ).join( '' );
          if ( name.startsWith( '.' ) ) {
            const implicitRule = { type: 'Rule', selector: name, body: node.body || [] };
            result.push( ...this.processRule( implicitRule, parentSelector ) );
          }
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
        else decls.push( this.resolveTokens( child ) );
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
        if ( item.type === 'Declaration' ) decls.push( this.resolveTokens( item ) );
        else nestedNodes.push( item );
      }
    }
  }

  resolveTokens ( decl ) {
    const propName = decl.name?.value;
    if ( !propName ) return decl;

    const category = getPropertyCategory( propName );
    const tokenMap = this.tokens.get( category );
    if ( !tokenMap ) return decl;

    if ( Array.isArray( decl.value ) ) {
      const resolvedValue = decl.value.map( ( item ) => {
        if ( item.type === 'IDENTIFIER' && tokenMap.has( item.value ) ) {
          return { ...item, value: tokenMap.get( item.value ) };
        }
        return item;
      } );
      return { ...decl, value: resolvedValue };
    }
    return decl;
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

function getPropertyCategory ( prop ) {
  if ( prop === 'margin' || prop.startsWith( 'margin-' ) ) return 'margin';
  if ( prop === 'padding' || prop.startsWith( 'padding-' ) ) return 'padding';
  if ( prop === 'gap' || prop.endsWith( '-gap' ) ) return 'gap';
  return prop;
}

function combineSelectors ( parent, child ) {
  if ( !parent ) return child;
  if ( child.includes( '&' ) ) return child.replaceAll( '&', parent );
  return `${parent}${child}`;
}
