// @ass/tokens.js

export const defaultTokens = {
  gap: {
    tiny   : '0.25rem',
    small  : '0.50rem',
    normal : '1.00rem',
    big    : '2.00rem',
    huge   : '3.00rem'
  },
  margin: {
    tiny   : '0.25rem',
    small  : '0.50rem',
    normal : '1.00rem',
    big    : '2.00rem',
    huge   : '3.00rem'
  },
  padding: {
    tiny   : '0.25rem',
    small  : '0.50rem',
    normal : '1.00rem',
    big    : '2.00rem',
    huge   : '3.00rem'
  },
  
};

export function createDefaultTokenMap ( customTokens = {} ) {
  const merged = { ...defaultTokens };
  for ( const [ cat, map ] of Object.entries( customTokens ) ) {
    merged[cat] = { ...( merged[cat] || {} ), ...map };
  }

  const categoryMap = new Map();
  for ( const [ category, tokens ] of Object.entries( merged ) ) {
    categoryMap.set( category, new Map( Object.entries( tokens ) ) );
  }
  return categoryMap;
}
