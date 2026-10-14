// @aufbau/element/manifest.js
// a custom elements manifest (custom-elements.json, schema 2.0.0) from what the
// classes declare: static attr, reflect, parts, events and slots. no code
// analysis, the schema is data. editors (vs code custom data, jetbrains), docs
// pages and storybook read the result.
//
//   import { manifest } from '@aufbau/element/manifest.js';
//   manifest([{ path: 'webcomponents/btn-chip.js', tag: 'btn-chip' }]);   // defined tags
//
// events and slots are declared next to the schema:
//
//   static events = { change: 'the value changed' };
//   static slots  = { '': 'the content', icon: 'an icon before the label' };

import { isAttribute, schemaOf } from './lib/schema.js';

const TYPE_NAMES = new Map([[Array, 'array'], [Boolean, 'boolean'], [Function, 'function'], [Number, 'number'], [Object, 'object'], [String, 'string']]);

const typeOf = entry => ({
  text: entry.values ? entry.values.map(value => JSON.stringify(value)).join(' | ') : (TYPE_NAMES.get(entry.type) ?? entry.type?.name?.toLowerCase() ?? 'string'),
});

const defaultOf = entry => entry.fallback === undefined ? undefined : JSON.stringify(entry.fallback);

const describe = (map = {}) => Object.entries(map).map(([name, description]) => ({ description, name }));

// one declaration per element class
function declarationOf (Class, tag) {
  const reflect = new Set(Class.reflect ?? []);
  const entries = [...schemaOf(Class).values()];

  return {
    attributes    : entries.filter(isAttribute).map(entry => ({ default: defaultOf(entry), fieldName: entry.name, name: entry.attribute, type: typeOf(entry) })),
    cssParts      : (Class.parts ?? []).map(name => ({ name })),
    customElement : true,
    events        : describe(Class.events),
    kind          : 'class',
    members       : entries.filter(entry => !entry.state).map(entry => ({
      ...(isAttribute(entry) ? { attribute: entry.attribute } : {}),
      default  : defaultOf(entry),
      kind     : 'field',
      name     : entry.name,
      reflects : reflect.has(entry.name) || reflect.has(entry.attribute) || undefined,
      type     : typeOf(entry),
    })),
    name          : Class.name,
    slots         : describe(Class.slots),
    tagName       : tag,
  };
}

// entries: { tag, path } with the tag defined, or { Class, tag, path }
function manifest (entries) {
  const modules = new Map;

  for (const { tag, Class = customElements.get(tag), path = `${tag}.js` } of entries) {
    if (!Class) continue;
    const module = modules.get(path) ?? modules.set(path, { declarations: [], exports: [], kind: 'javascript-module', path }).get(path);
    module.declarations.push(declarationOf(Class, tag));
    module.exports.push({ declaration: { module: path, name: Class.name }, kind: 'custom-element-definition', name: tag });
  }

  return JSON.parse(JSON.stringify({ modules: [...modules.values()], schemaVersion: '2.0.0' }));
}

export { declarationOf, manifest };
export default manifest;
