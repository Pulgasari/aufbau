// @aufbau/bundler/steps/report.js
// what the output still reaches over the network: every https host mentioned in
// the project's own files. the copied packages and vendored modules are left
// out, their docs, licenses and examples are full of urls. and the size.

import { isText, listFiles, megabytes, outputPath, readText, sizeOf } from './../shared.js';

async function report ({ config, out, report: add }) {
  const skipped = [config.packages?.path ?? '/_pkg', config.vendor?.path ?? '/_vendor'].map(path => path.replace(/\/+$/, '') + '/');
  const hosts   = new Map;   // host -> files

  for (const file of await listFiles(out)) {
    const path = outputPath(out, file);
    if (!isText(file) || skipped.some(prefix => path.startsWith(prefix))) continue;
    for (const [, host] of (await readText(file)).matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})\//g)) {
      if (!hosts.has(host)) hosts.set(host, new Set);
      hosts.get(host).add(path);
    }
  }

  const list = files => [...files].sort().slice(0, 4).join(', ') + (files.size > 4 ? ` … (${files.size} files)` : '');
  add('size', [`${megabytes(await sizeOf(out))} mb`]);
  add('network', [...hosts].sort(([a], [b]) => a.localeCompare(b)).map(([host, files]) => `\`${host}\` — ${list(files)}`));
}

export { report };
export default report;
