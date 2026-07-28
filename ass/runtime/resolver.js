// /ass/runtime/resolver.js
// resolve tokens, default units, and property normalization

import { defaultUnits, defaultTokens } from '../tokens.js';



export function normalizeProp ( prop ) {
  return prop.replace( /-([a-z])/g, ( _, char ) => char.toUpperCase() );
}

export function resolveValue ( prop, val, customTokens ) {
  if ( typeof val === 'number' ) {
    const norm = normalizeProp( prop );
    const unit = defaultUnits[norm] ?? 'px';
    return `${val}${unit}`;
  }

  if ( typeof val === 'string' ) {
    const tokens = customTokens || defaultTokens;
    const category = getCategory( prop );
    if ( tokens[category] && tokens[category][val] ) {
      return tokens[category][val];
    }
  }

  return val;
}

function getCategory ( prop ) {
  const norm = normalizeProp( prop );
  if ( norm.startsWith( 'margin' ) ) return 'margin';
  if ( norm.startsWith( 'padding' ) ) return 'padding';
  if ( norm.endsWith( 'Gap' ) || norm === 'gap' ) return 'gap';
  return norm;
}
