// templates for the elements: htx, rendered by @domina/render through
// @aufbau/element. only the holes that changed are written on an update.

export { each, html, raw, when } from '@aufbau/element';

// attributes for a spread, ...${attrs({ … })}: false, null and '' are left out,
// as html.js did
export const attrs = map => Object.fromEntries(Object.entries(map ?? {}).filter(([, value]) => value !== false && value != null && value !== ''));
