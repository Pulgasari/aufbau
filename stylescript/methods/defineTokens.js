// stylescript/tokens.js

/**
 * Normalizes camelCase or nested keys to CSS variable names.
 * Example: colors.brandPrimary -> --colors-brand-primary
 */
function toCssVarName(path) {
  return '--' + path.join('-').replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/**
 * Defines Design Tokens, generates corresponding CSS Custom Properties,
 * and returns a typed Proxy tree for seamless JS usage.
 */
export function defineTokens(tokenConfig) {
  const cssVariables = {};

  function processTree(obj, path = []) {
    const proxyTarget = {};

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];
      const varName = toCssVarName(currentPath);

      if (Array.isArray(value)) {
        // Multi-value token (e.g. background & foreground pair: ['#000', '#fff'])
        const [bg, fg] = value;
        cssVariables[`${varName}-bg`] = bg;
        cssVariables[`${varName}-fg`] = fg;

        proxyTarget[key] = {
          bg: `var(${varName}-bg)`,
          fg: `var(${varName}-fg)`,
          raw: value,
        };
      } else if (typeof value === 'object' && value !== null) {
        // Recursive nested token group
        proxyTarget[key] = processTree(value, currentPath);
      } else {
        // Primitive token value
        cssVariables[varName] = String(value);
        proxyTarget[key] = `var(${varName}, ${value})`;
      }
    }

    return proxyTarget;
  }

  const tokenTree = processTree(tokenConfig);

  return {
    tokens: tokenTree,
    /**
     * Generates a flat :root CSS block for domina / stylescript sheets.
     */
    toCSS(selector = ':root') {
      const decls = Object.entries(cssVariables)
        .map(([varName, val]) => `  ${varName}: ${val};`)
        .join('\n');
      return `${selector} {\n${decls}\n}`;
    }
  };
}
