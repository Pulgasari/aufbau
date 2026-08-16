// methods/hash.js

// synchronous, dependency-free content fingerprint (fnv-1a, 32-bit). used to
// content-address a compiled stylesheet so both its cache entry and its adopt
// key change exactly when the css changes. crypto.subtle is async and overkill
// for a cache-busting token, so it is deliberately avoided.

const OFFSET = 0x811c9dc5;
const PRIME  = 0x01000193;

export function hash (input) {
  const string = String(input);
  let   value  = OFFSET;

  for (let index = 0; index < string.length; index++) {
    value ^= string.charCodeAt(index);
    // multiply by the fnv prime in 32-bit space without float overflow
    value  = Math.imul(value, PRIME);
  }

  // fold to unsigned, base36 for a short attribute/url-safe token
  return (value >>> 0).toString(36);
}

export default hash;
