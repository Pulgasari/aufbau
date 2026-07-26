// @aufbau/stylesheet/dev/debug.js

function levenshtein (a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Validates token access and logs helpful warnings for typos
 */
export function warnMissingToken (propertyName, requestedToken, availableTokens) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;

  const tokenKeys = Object.keys(availableTokens || {});
  if (tokenKeys.length === 0) return;

  let bestMatch = null;
  let smallestDistance = Infinity;

  for (const key of tokenKeys) {
    const dist = levenshtein(requestedToken.toLowerCase(), key.toLowerCase());
    if (dist < smallestDistance && dist <= 3) {
      smallestDistance = dist;
      bestMatch = key;
    }
  }

  const suggestion = bestMatch ? ` Did you mean "${bestMatch}"?` : '';
  console.warn(
    `[Aufbau Warning] Unknown token "${requestedToken}" used for property "${propertyName}".${suggestion}`
  );
}
