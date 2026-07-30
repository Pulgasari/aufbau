

/**
 * Convert heading text into a URL-friendly slug.
 */
export function slugify (text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}
