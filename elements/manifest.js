// @aufbau/elements/manifest.js
// the custom elements manifest of every element: loads them all, reads their
// schemas (see @aufbau/element/manifest.js) and hands back custom-elements.json,
// or saves it as a file. runs in the browser, where the elements live:
//
//   import { download } from '@aufbau/elements/manifest.js';
//   await download();   // custom-elements.json

import { manifest }                    from '@aufbau/element/manifest.js';
import { TAGS, pathOf, registerAll } from './index.js';

async function manifestAll () {
  await registerAll();
  return manifest(TAGS.map(tag => ({ path: pathOf(tag).replace(/^\.\//, ''), tag })));
}

async function download (name = 'custom-elements.json') {
  const blob = new Blob([JSON.stringify(await manifestAll(), null, 2) + '\n'], { type: 'application/json' });
  const link = Object.assign(document.createElement('a'), { download: name, href: URL.createObjectURL(blob) });
  link.click();
  URL.revokeObjectURL(link.href);
}

export { download, manifestAll };
export default manifestAll;
