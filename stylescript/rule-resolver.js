// stylescript/rule-resolver.js
import CanonicalMap from './CanonicalMap.js';

// Normalizes raw input style objects to resolve property collisions
export function normalizeStyleObject(inputObject) {
  // CanonicalMap standardizes keys to kebab-case by default
  const cssMap = new CanonicalMap(inputObject, ['kebab', 'camel']);
  
  // Converts map back to a clean JS object with strictly kebab-cased keys
  return cssMap.toObject('kebab');
}

// Result: { 'font-size': '16px', 'background-color': 'blue' }
const cleanStyles = normalizeStyleObject({
  fontSize: '14px',
  'font-size': '16px', // Overwrites previous 'fontSize' key automatically
  backgroundColor: 'blue',
});
