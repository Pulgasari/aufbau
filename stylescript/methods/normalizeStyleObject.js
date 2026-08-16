// methods/normalizeStyleObject.js

import { CanonicalMap } from './../vendors.js';

// Normalizes raw input style objects to resolve property collisions
export function normalizeStyleObject (inputObject) {
  // CanonicalMap standardizes keys to kebab-case by default
  const cssMap = new CanonicalMap(inputObject, ['kebab', 'camel']);
  
  // Converts map back to a clean JS object with strictly kebab-cased keys
  return cssMap.toObject('kebab');
}
