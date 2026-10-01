// @aufbau/components/core/names.js
// every component tag goes through here, so a page can rename them:
//
//   configure({ prefix: 'x-' })                           input-icon -> x-input-icon
//   configure({ rename: { 'input-icon': 'icon-field' } }) input-icon -> icon-field
//
// only the components are renamed. the elements inside keep their aufbau-*
// tags, the skin selects them by name. a component that uses another one asks
// tagOf() for its tag. configure before the first component loads: a tag that
// is defined stays defined.

// the canonical names, <group>-<name> maps to ./<group>/<name>.js
export const COMPONENTS = [
  'app-area',
  'app-config',
  'app-float',
  'app-panel',
  'app-root',
  'app-view',
  'div-x',
  'div-y',
  'embed-bandcamp',
  'embed-mastodon',
  'embed-soundcloud',
  'embed-spotify',
  'embed-vimeo',
  'embed-youtube',
  'input-bool',
  'input-chips',
  'input-color',
  'input-country',
  'input-currency',
  'input-date',
  'input-email',
  'input-emoji',
  'input-font',
  'input-hotkey',
  'input-icon',
  'input-item',
  'input-language',
  'input-locale',
  'input-number',
  'input-password',
  'input-phone',
  'input-search',
  'input-slug',
  'input-text',
  'input-time',
  'input-timezone',
  'input-unit',
  'input-url',
  'input-year',
  'write-md',
];

const renamed = new Map;
let   prefix  = '';
let   defined = false;

export function configure ({ prefix: next, rename = {} } = {}) {
  if (defined) console.warn('[@aufbau/components] configure() after a component was defined, its tag stays as it is.');
  if (next != null) prefix = String(next);
  for (const [name, tag] of Object.entries(rename)) renamed.set(name, tag);
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
