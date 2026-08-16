// methods/resolveDeclaration.js

// kebab-cases a property name, leaving custom properties (--x) untouched. this is
// the fallback when no alias registry resolves the name.
export const kebabProperty = (prop) =>
  prop.startsWith('--') ? prop : prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

// serializes a value with no controller context. typed values (CssValue and its
// subclasses) coerce through their toString; everything else is stringified.
export const serializeValue = (value) => String(value);

// resolves one { prop: value } pair into [cssProperty, cssValue]. an optional
// context (a controller) may expose property(name) and value(raw) to apply alias
// and token resolution; without it, names are kebab-cased and values stringified.
export function resolveDeclaration (prop, value, context) {
  const property = context?.property ? context.property(prop)  : kebabProperty(prop);
  const resolved = context?.value    ? context.value(value)    : serializeValue(value);
  return [property, resolved];
}

export default resolveDeclaration;
