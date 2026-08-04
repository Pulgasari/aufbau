// @aufbau/elements/core

/**
 * Parses a schema entry (Minimal, Basic, or Full) into a normalized schema object.
 * @param {*} entry - e.g. Number, 50, or { type: Number, default: 0, values: [...], fn: ... }
 */
export const parseSchemaEntry = (entry) => {
  // CASE 1: direct constructor function (e.g. Number, Boolean, String)
  if (typeof entry === 'function') {
    return { type: entry, fallback: undefined, values: null, fn: null };
  }

  // CASE 2: full configuration object
  if (typeof entry === 'object' && entry !== null && !Array.isArray(entry)) {
    const explicitType = entry.type;
    const fallback = entry.default;
    
    // Infer type constructor from default value if type is omitted
    const inferredType = explicitType || (
        typeof fallback === 'number'  ? Number
      : typeof fallback === 'boolean' ? Boolean
      : typeof fallback === 'string'  ? String 
      : String
    );

    return {
      type: inferredType,
      fallback: fallback,
      values: Array.isArray(entry.values) ? entry.values : null,
      fn: typeof entry.fn === 'function' ? entry.fn : null
    };
  }

  // Case 3: Primitive default values (number, boolean, string)
  if (typeof entry === 'number')  return { type: Number,  fallback: entry, values: null, fn: null };
  if (typeof entry === 'boolean') return { type: Boolean, fallback: entry, values: null, fn: null };
  if (typeof entry === 'string')  return { type: String,  fallback: entry, values: null, fn: null };

  return { type: String, fallback: undefined, values: null, fn: null };
};

export default parseSchemaEntry;
