// @aufbau/components/core/names.js
// every component tag goes through here, so a page can rename them:
//
//   configure({ prefix: 'x-' })                         pick-icon -> x-pick-icon
//   configure({ names: { 'pick-icon': 'icon-field' } }) pick-icon -> icon-field
//
// only the components are renamed. the elements inside keep their aufbau-*
// tags, the skin selects them by name. a component that uses another one asks
// tagOf() for its tag. configure before the first component loads: a tag that
// is defined stays defined.

// the canonical names, <group>-<name> maps to ./<group>/<name>.js
export const COMPONENTS = [
  'pick-icon',
  'pick-language',
  'write-md',
];

const renamed = new Map;
let   prefix  = '';
let   defined = false;

export function configure ({ names = {}, prefix: next } = {}) {
  if (defined) console.warn('[@aufbau/components] configure() after a component was defined, its tag stays as it is.');
  if (next != null) prefix = String(next);
  for (const [name, tag] of Object.entries(names)) renamed.set(name, tag);
}

/** the tag a canonical name is defined under */
export const tagOf = name => renamed.get(name) ?? prefix + name;

/** the canonical name behind a tag, null when the tag is no component */
export const nameOf = tag => COMPONENTS.find(name => tagOf(name) === tag) ?? null;

/** the module of a canonical name, relative to the package root */
export const pathOf = name => {
  const [group, ...rest] = name.split('-');
  return `./${group}/${rest.join('-')}.js`;
};

/** defines a component under its (possibly renamed) tag */
export function define (name, Class) {
  defined = true;
  Class.init(tagOf(name));
  return Class;
}
