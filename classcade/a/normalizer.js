// normalizer.js

// Heuristik: enthält der String eine "[", ist es classcade-Syntax (auch ohne
// Wert, z.B. Referenz auf einen anderen Shorthand wie "block").
// Sonst, wenn er ein "prop: value"-Muster hat, ist es rohes CSS.
function isCssDeclString (str) {
  return !str.includes('[') && /^[a-zA-Z-]+\s*:/.test(str);
}

export function normalizeSpec (spec, resolveClasscadeString) {
  if (spec == null) return {};

  if (Array.isArray(spec)) {
    return spec.reduce((acc, s) => Object.assign(acc, normalizeSpec(s, resolveClasscadeString)), {});
  }

  if (typeof spec === 'object') {
    if ('prop' in spec && 'value' in spec) return { [spec.prop]: spec.value };
    return spec; // schon ein flaches { prop: value }-Objekt
  }

  if (typeof spec === 'string') {
    const trimmed = spec.trim();

    if (isCssDeclString(trimmed)) {
      return trimmed.split(';').map(s => s.trim()).filter(Boolean).reduce((acc, decl) => {
        const i = decl.indexOf(':');
        if (i === -1) return acc;
        acc[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
        return acc;
      }, {});
    }

    return resolveClasscadeString(trimmed); // z.B. "bg[transparent]" oder "block"
  }

  throw new Error(`[classcade] Cannot normalize spec: ${JSON.stringify(spec)}`);
}
