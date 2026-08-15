// stylescript/shorthands/unset.js

/**
 * Generates an object resetting specified CSS properties.
 * 
 * @param {...string} properties - CSS properties to reset
 * @returns {Object} Flat style declarations
 */
export function unset (...properties) {
  const result = {};
  
  for (const prop of properties.flat(Infinity)) {
    // Support both camelCase and kebab-case
    const cssProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    result[cssProp] = 'unset';
  }

  return result;
}
