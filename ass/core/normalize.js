export function normalizeName (name) {
  return name
    .replace(/^--/, "")
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
