// @aufbau/elements/manifest.js
// the custom elements manifest of every element: loads them all, reads their
// schemas (see @domina/element/manifest.js) and hands back custom-elements.json,
// or saves it as a file. runs in the browser, where the elements live:
//
//   import { download } from '@aufbau/elements/manifest.js';
//   await download();   // custom-elements.json
//
// the file in this package is made that way and read by editor tooling
// (@htx/ts-plugin finds it through "customElements" in package.json). run it
// again after an element's schema, events or slots changed.

import { manifest }                    from '@domina/element/manifest.js';
import { TAGS, pathOf, registerAll } from './index.js';

async function manifestAll () {
  await registerAll();
  return manifest(TAGS.map(tag => ({ path: pathOf(tag).replace(/^\.\//, ''), tag })));
}

// one module per line: a third of the indented size, and still a diff per element
const format = manifest => `{"schemaVersion":${JSON.stringify(manifest.schemaVersion)},"modules":[\n${manifest.modules.map(module => JSON.stringify(module)).join(',\n')}\n]}\n`;

async function download (name = 'custom-elements.json') {
  const blob = new Blob([format(await manifestAll())], { type: 'application/json' });
  const link = Object.assign(document.createElement('a'), { download: name, href: URL.createObjectURL(blob) });
  link.click();
  URL.revokeObjectURL(link.href);
}

export { download, format, manifestAll };
export default manifestAll;
