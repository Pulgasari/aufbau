// @aufbau/bundler/steps/copy.js
// copies the project's own files into the output, `to` relative to it:
//
//   copy: [{ from: 'index.html' }, { from: '.shared' }, { from: 'apps/notes', to: 'notes' }]
//
// for now everything under a source goes along. what a page never loads is sorted
// out later by a prune step (see concept.md).

import { join } from 'node:path';
import { copy as copyFiles } from './../shared.js';

async function copy ({ config, log, out, root }) {
  for (const { from, to = from } of config.copy ?? []) {
    await copyFiles(join(root, from), join(out, to));
    log(`copy ${from}${to === from ? '' : ` -> ${to}`}`);
  }
}

export { copy };
export default copy;
