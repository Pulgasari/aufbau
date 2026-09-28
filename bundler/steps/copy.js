// @aufbau/bundler/steps/copy.js
// copies the project's own files into the output, `to` relative to it:
//
//   copy: [{ from: 'index.html' }, { from: '.shared' }, { from: 'apps/notes', to: 'notes' }]
//
// everything under a source goes along, prune drops what nothing reaches.

import { copyPath, joinPath, SKIP } from './../shared.js';

async function copy ({ config, log, out, root }) {
  for (const { from, to = from } of config.copy ?? []) {
    await copyPath(joinPath(root, from), joinPath(out, to), { skip: SKIP });
    log(`copy ${from}${to === from ? '' : ` -> ${to}`}`);
  }
}

export { copy };
export default copy;
