import { slugify } from '@aufbau/utils';

/**
 * Resolves variables/aliases inside a path string.
 * Supports nested variables (e.g. $comps using $repo).
 * 
 * @param {string} pathStr - Raw path string (e.g. "$comps/readme.md")
 * @param {Object} vars - Variable dictionary (e.g. { repo: '../', comps: '$repo/webcomponents' })
 * @returns {string} Fully resolved file path
 */
export function resolvePath(pathStr, vars = {}) {
  if (!pathStr || typeof pathStr !== 'string') return pathStr;

  let resolved = pathStr;
  let maxPasses = 10; // Prevent infinite loops on circular variables

  while (maxPasses-- > 0) {
    let replaced = false;
    resolved = resolved.replace(/\$(\{([a-zA-Z0-9_]+)\}|([a-zA-Z0-9_]+))/g, (match, _, braced, unbraced) => {
      const varName = braced || unbraced;
      if (Object.prototype.hasOwnProperty.call(vars, varName)) {
        replaced = true;
        return vars[varName];
      }
      return match;
    });

    if (!replaced) break;
  }

  // Clean up duplicate slashes (preserving protocols like http://)
  return resolved.replace(/(?<!:)\/{2,}/g, '/');
}

/**
 * Extract path and heading anchor ID from location hash.
 * Example: "#/$comps/readme.md#installation" -> { path: "$comps/readme.md", anchor: "installation" }
 * 
 * @param {string} [defaultPath='readme.md']
 * @returns {{ path: string, anchor: string|null }}
 */
export function parseHash(defaultPath = 'readme.md') {
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  if (!rawHash) return { path: defaultPath, anchor: null };

  const [path, anchor] = rawHash.split('#');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return {
    path   : cleanPath || defaultPath,
    anchor : anchor    || null
  };
}
