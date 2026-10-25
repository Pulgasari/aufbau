// @aufbau/elements/vite.js
// in a build, the elements a file names in its markup are imported where it names them, and
// autoloader() only knows those (and the tags of options.runtime, which appear only at runtime:
// from markdown, from a string). the other ~70 element modules are not part of the build at all

import { readFileSync }   from 'node:fs';
import { createUnplugin } from 'unplugin';

const PACKAGE  = '@aufbau/elements';
const VIRTUAL  = '\0aufbau-elements';
const manifest = JSON.parse(readFileSync(new URL('./custom-elements.json', import.meta.url), 'utf8'));

// tag -> its module, from the manifest: btn-icon -> webcomponents/btn-icon.js
const MODULES = Object.fromEntries(
  manifest.modules.flatMap(
    module => (module.declarations ?? [])
      .filter(declaration => declaration.tagName)
      .map(declaration => [declaration.tagName, module.path])
  )
);

const TAG = /<([a-z][a-z0-9]*-[a-z0-9-]*)[\s>/]/g;

const tagsIn = code => new Set([...code.matchAll(TAG)].map(match => match[1]).filter(tag => MODULES[tag]));

export const unplugin = createUnplugin(({ runtime = [] } = {}) => {
  const used = new Set(runtime);

  return {
    name    : 'aufbau-elements',
    enforce : 'post',

    // the package's entry becomes one that knows only the tags of this build
    resolveId (id) { return id === PACKAGE ? VIRTUAL : null; },

    load (id) {
      if (id !== VIRTUAL) return null;
      const entries = [...used].sort().map(tag => `  '${tag}': () => import('${PACKAGE}/${MODULES[tag]}'),`);
      return `
        const MODULES = {\n${entries.join('\n')}\n};
        const TAGS    = Object.keys(MODULES);
        const load    = tag => MODULES[tag]?.() ?? Promise.resolve(null);
        function autoloader ({ root = document } = {}) {
          const scan = node => { if (node?.nodeType === 1) [node, ...node.querySelectorAll('*')].forEach(element => !customElements.get(element.localName) && load(element.localName)); };
          scan(root.documentElement ?? root);
          const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(scan)));
          observer.observe(root.body ?? root.documentElement ?? root, { childList: true, subtree: true });
          return () => observer.disconnect();
        }
        const registerAll = () => Promise.all(TAGS.map(load));
        export { TAGS, autoloader, load, registerAll };
      `;
    },

    transformInclude: id => /\.(js|mjs|rat|rat\.html|rat\.js)(\?|$)/.test(id) && !id.includes('/aufbau/elements/'),

    // the tags in the markup of a file: imported here, so they are defined before the file renders
    transform (code) {
      const tags = tagsIn(code);
      if (!tags.size) return null;
      for (const tag of tags) used.add(tag);
      return [...tags].sort().map(tag => `import '${PACKAGE}/${MODULES[tag]}';`).join('\n') + '\n' + code;
    },
  };
});

export default unplugin.vite;
