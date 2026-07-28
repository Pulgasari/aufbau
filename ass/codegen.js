// generate final css string via cosmonaut generator
import Generator, { concat, hardline, indent, print, text } from '@cosmonaut/generator';

const methods = {
  genIDENTIFIER : ( g, node ) => text( node.value ),
  genNUMBER     : ( g, node ) => text( node.value ),
  genSTRING     : ( g, node ) => text( node.value ),
  genAT_KEYWORD : ( g, node ) => text( node.value ),
  genPUNCT      : ( g, node ) => text( node.value ),

  genDeclaration : ( g, node ) => {
    const val = Array.isArray( node.value ) ? node.value.map( ( v ) => v.value ).join( ' ' ) : g.genNode( node.value );
    return concat( text( node.name.value ), text( ': ' ), text( val ), text( ';' ) );
  },

  genRule : ( g, node ) => {
    const sel = typeof node.selector === 'string' ? node.selector : Array.isArray( node.selector ) ? node.selector.map( ( s ) => s.value ).join( '' ) : g.genNode( node.selector );
    const bodyDocs = ( node.body || [] ).map( ( stmt ) => g.genNode( stmt ) );
    return concat(
      text( sel ), text( ' {' ),
      indent( concat( hardline, bodyDocs.reduce( ( acc, curr ) => concat( acc, curr, hardline ), text( '' ) ) ) ),
      text( '}' )
    );
  },
  
  genAtRule : ( g, node ) => {
    const params = node.params ? node.params.map( ( p ) => p.value ).join( ' ' ) : '';
    const header = params ? `${node.name.value} ${params}` : node.name.value;
    if ( !node.body ) return concat( text( header ), text( ';' ) );
    const bodyDocs = node.body.map( ( stmt ) => g.genNode( stmt ) );
    return concat(
      text( header ), text( ' {' ),
      indent( concat( hardline, bodyDocs.reduce( ( acc, curr ) => concat( acc, curr, hardline ), text( '' ) ) ) ),
      text( '}' )
    );
  }
};

const generator = new Generator ({ methods });

export function renderToCSS (ast) {
  const docs = ast.map( ( node ) => generator.genNode( node ) );
  const doc = docs.reduce( ( acc, curr, i ) => ( i === 0 ? curr : concat( acc, hardline, hardline, curr ) ), text( '' ) );
  return print( doc );
}
