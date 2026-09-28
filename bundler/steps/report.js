// @aufbau/bundler/steps/report.js
// what the output still reaches over the network: every https host mentioned in
// the project's own files. the copied packages and vendored modules are left
// out, their docs, licenses and examples are full of urls. this is the list the later steps (vendor, icons,
// webfonts) work down.

import { readFile, stat } from 'node:fs/promises';
import { relative } from 'node:path';
import { isText, walk } from './../shared.js';

async function report ({ config, out, report: add }) {
  const skipped  = [config.packages?.path ?? '/_pkg', config.vendor?.path ?? '/_vendor'].map(path => path.replace(/^\/+/, '') + '/');
  const hosts    = new Map;   // host -> files
  let bytes = 0;

  for (const file of await walk(out)) {
    bytes += (await stat(file)).size;
    const path = relative(out, file);
    if (!isText(file) || skipped.some(prefix => path.startsWith(prefix))) continue;
    for (const [, host] of (await readFile(file, 'utf8')).matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})\//g)) {
      if (!hosts.has(host)) hosts.set(host, new Set);
      hosts.get(host).add(path);
    }
  }

  const list = files => [...files].sort().slice(0, 4).join(', ') + (files.size > 4 ? ` … (${files.size} files)` : '');
  add('size', [`${(bytes / 1024 / 1024).toFixed(1)} mb`]);
  add('network', [...hosts].sort(([a], [b]) => a.localeCompare(b)).map(([host, files]) => `\`${host}\` — ${list(files)}`));
}

export { report };
export default report;
