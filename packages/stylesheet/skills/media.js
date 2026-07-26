// @aufbau/stylesheet/skills/media.js

// Wandelt Breakpoint-Operatoren und Token in valides CSS-Media-Query-Syntax um
// Example: (>= tablet) -> (min-width: 768px)
function resolveMediaCondition(conditionStr, mediaTokens) {
  return conditionStr.replace(/\(\s*([><]=?)\s*([a-zA-Z0-9_-]+)\s*\)/g, (match, operator, tokenKey) => {
    const val = mediaTokens?.[tokenKey] || tokenKey;

    switch (operator) {
      case '>=':
      case '>':
        return `(min-width: ${val})`;
      case '<=':
      case '<':
        return `(max-width: ${val})`;
      default:
        return match;
    }
  });
}

// Transformiert @aufbau-media Blöcke & @media-media Anweisungen
export function transformMedia (code, tokens) {
  let result = code;

  // 1. Convert @media-media -> @media
  result = result.replace(/@media-media/g, '@media');

  // 2. Resolve Breakpoint tokens in @media conditions
  result = result.replace(/@media\s*([^{]+)\{/g, (match, condition) => {
    const resolvedCondition = resolveMediaCondition(condition, tokens?.media);
    return `@media ${resolvedCondition}{`;
  });

  return result;
}
