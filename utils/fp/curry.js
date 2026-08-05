// ============================================================================
// AUTO-CURRY IMPLEMENTATION
// ============================================================================

// Wraps a multi-argument function to support step-by-step argument passing
export const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...nextArgs) => curried(...args, ...nextArgs);
  };
};
