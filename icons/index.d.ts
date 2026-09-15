// @aufbau/icons — type notations

/** short aufbau icon name, e.g. `'save'`, `'chevron-down'`. */
export type IconName = string;

/** full iconify id, e.g. `'material-symbols:file-save'`. */
export type IconId = string;

/** name -> iconify-id lookup table. */
export type IconMap = Record<IconName, IconId>;

export const brands:   IconMap;
export const code:     IconMap;
export const icons:    IconMap;
export const standard: IconMap;
export const fallback: IconId;

/** the registered `<aufbau-icon>` custom element, re-exported from @aufbau/elements. */
export const AufbauIcon: CustomElementConstructor;

/**
 * resolve a short aufbau name to a full iconify id. names already carrying a
 * collection (containing `:`) pass through untouched, unknown names return `fallback`.
 */
export function resolve (name?: IconName): IconId;

declare const _default: {
  AufbauIcon: CustomElementConstructor;
  brands:     IconMap;
  code:       IconMap;
  fallback:   IconId;
  icons:      IconMap;
  resolve:    typeof resolve;
  standard:   IconMap;
};

export default _default;
