// @aufbau/elements/core

export const parseSchemaEntry = (entry) => {
  
  // CASE 1: direct constructor function (e.g. Number, Boolean, String)
  if (typeof entry === 'function') {
    return { type: entry, fallback: undefined, config: null, fn: null, values: null };
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
      type     : inferredType,
      fallback : fallback,
      values   : Array.isArray(entry.values) ? entry.values : null,
      fn       : typeof entry.fn === 'function' ? entry.fn : null,
      // true -> auto namespaced key, string|string[] -> explicit keys
      config   : entry.config === true ? true : (entry.config ? [].concat(entry.config) : null)
    };
  }

  // Case 3: Primitive default values (number, boolean, string)
  if (typeof entry === 'number')  return { type: Number,  fallback: entry, config: null, values: null, fn: null };
  if (typeof entry === 'boolean') return { type: Boolean, fallback: entry, config: null, values: null, fn: null };
  if (typeof entry === 'string')  return { type: String,  fallback: entry, config: null, values: null, fn: null };

  return { type: String, fallback: undefined, values: null, fn: null };
};

export default parseSchemaEntry;
