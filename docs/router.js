import { slugify } from '@aufbau/utils';

/**
 * Extract path and heading anchor ID from location hash.
 * Example: "#/readme.md#installation" -> { path: "readme.md", anchor: "installation" }
 */
export function parseHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return { path: 'readme.md', anchor: null };

  const [path, anchor] = hash.split('#');
  // Normalize leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return {
    path: cleanPath || 'readme.md',
    anchor: anchor || null
  };
}
