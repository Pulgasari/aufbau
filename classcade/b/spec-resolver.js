// spec-resolver.js

// Erkennt "prop: value; prop2: value2" (rohes CSS) vs. classcade-Syntax
// ("bg[transparent]", "block"). Heuristik: enthält der String kein "[" und
// matched das Muster "ident:", ist es CSS. Sonst wird's als classcade-String
// an den mitgegebenen Resolver zurückgereicht.
function looksLikeCss (str) {
  return !str.includes('[') && /^[a-zA-Z-]+\s*:/.test(str);
}

function fromCssString (str) {
  return str.split(';').map(s => s.trim()).filter(Boolean).reduce((acc, decl) => {
    const i = decl.indexOf(':');
    if (i === -1) return acc;
    acc[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
    return acc;
  }, {});
}

// resolveClasscadeString: (source: string) => { [prop]: value }
// wird vom Compiler injiziert (nutzt dessen eigenen Parser+Resolver)
export function normalizeSpec (spec, resolveClasscadeString) {
  if (spec == null) return {};

  if (Array.isArray(spec)) {
    return spec.reduce((acc, s) => Object.assign(acc, normalizeSpec(s, resolveClasscadeString)), {});
  }

  if (typeof spec === 'object') {
    if ('prop' in spec && 'value' in spec) return { [spec.prop]: spec.value };
    return { ...spec }; // schon ein flaches { prop: value }
  }

  if (typeof spec === 'string') {
    const trimmed = spec.trim();
    return looksLikeCss(trimmed) ? fromCssString(trimmed) : resolveClasscadeString(trimmed);
  }

  throw new Error(`[classcade] Cannot normalize spec: ${JSON.stringify(spec)}`);
}
