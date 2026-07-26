// @aufbau/stylesheet/skills/media.js

// :::::: pre-compiled RegExp rules

const REGEX_MEDIA_CONDITION = /\(\s*([><]=?)\s*([a-zA-Z0-9_-]+)\s*\)/g;
const REGEX_MEDIA_MEDIA     = /@media-media/g;
const REGEX_MEDIA_BLOCK     = /@media\s*([^{]+)\{/g;

// :::::: helpers

function resolveMediaCondition(conditionStr, mediaTokens) {
  return conditionStr.replace(REGEX_MEDIA_CONDITION, (match, operator, tokenKey) => {
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

// :::::: main export

export default function (code, tokens) {
  return code
    .replace(REGEX_MEDIA_MEDIA, '@media')
    .replace(REGEX_MEDIA_BLOCK, (match, condition) => {
      const resolvedCondition = resolveMediaCondition(condition, tokens?.media);
      return `@media ${resolvedCondition}{`;
    });
}
