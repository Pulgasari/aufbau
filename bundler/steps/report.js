// @aufbau/bundler/steps/report.js
// what came out and what it costs:
//
//   files       input (before prune, see survey.js) against output, per extension
//   compressed  the text files as a server sends them, gzip and brotli
//   areas       the project's own files, the copied packages, the vendored modules
//   largest     the biggest files of the output
//   duplicates  files with the same content under different paths
//   network     every https host the project's own files still mention. the
//               packages and vendored modules are left out, their docs,
//               licenses and examples are full of urls
//
// bundle() adds the time of every step after this one.

import { createHash }                            from 'node:crypto';
import { readFile }                              from 'node:fs/promises';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

import { formatBytes, inventory, isText, readText } from './../shared.js';

const LARGEST    = 8;
const DUPLICATES = 5;

const sum = entries => entries.reduce((total, entry) => total + entry.bytes, 0);

// extension -> { count, bytes }
function byExtension (entries) {
  const groups = new Map;
  for (const { bytes, extension } of entries) {
    const group = groups.get(extension) ?? { bytes: 0, count: 0 };
    group.bytes += bytes;
    group.count += 1;
    groups.set(extension, group);
  }
  return groups;
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function files (input, output) {
  const lines = [`output: ${plural(output.length, 'file')}, ${formatBytes(sum(output))}`];
  if (input) {
    lines.unshift(`input: ${plural(input.length, 'file')}, ${formatBytes(sum(input))}`);
    lines.push(`dropped: ${plural(input.length - output.length, 'file')}, ${formatBytes(sum(input) - sum(output))}`);
  }

  const before = input ? byExtension(input) : new Map;
  const after  = byExtension(output);
  const names  = [...new Set([...before.keys(), ...after.keys()])]
    .sort((a, b) => (after.get(b)?.bytes ?? 0) - (after.get(a)?.bytes ?? 0) || a.localeCompare(b));

  for (const name of names) {
    const was = before.get(name);
    const is  = after.get(name) ?? { bytes: 0, count: 0 };
    lines.push(was
      ? `\`${name}\` ${was.count} → ${is.count}, ${formatBytes(was.bytes)} → ${formatBytes(is.bytes)}`
      : `\`${name}\` ${is.count}, ${formatBytes(is.bytes)}`);
  }

  return lines;
}

async function compressed (output) {
  let raw = 0, gzip = 0, brotli = 0;
  for (const { file } of output.filter(entry => isText(entry.file))) {
    const data = await readFile(file);
    raw    += data.length;
    gzip   += gzipSync(data, { level: 9 }).length;
    brotli += brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  }
  if (!raw) return [];
  const share = bytes => `${Math.round(bytes / raw * 100)} %`;
  return [`text files ${formatBytes(raw)}: gzip ${formatBytes(gzip)} (${share(gzip)}), brotli ${formatBytes(brotli)} (${share(brotli)})`];
}

function areas (output, skipped) {
  const own   = output.filter(entry => !skipped.some(prefix => entry.path.startsWith(prefix)));
  const lines = [`own files: ${plural(own.length, 'file')}, ${formatBytes(sum(own))}`];
  for (const prefix of skipped) {
    const part = output.filter(entry => entry.path.startsWith(prefix));
    if (!part.length) continue;

    // the biggest packages inside, by their first path segment
    const groups = new Map;
    for (const entry of part) {
      const name = entry.path.slice(prefix.length).split('/').slice(0, entry.path.slice(prefix.length).startsWith('@') ? 2 : 1).join('/');
      groups.set(name, (groups.get(name) ?? 0) + entry.bytes);
    }
    const top = [...groups].sort(([, a], [, b]) => b - a).slice(0, 4).map(([name, bytes]) => `${name} ${formatBytes(bytes)}`).join(', ');
    lines.push(`\`${prefix}\`: ${plural(part.length, 'file')}, ${formatBytes(sum(part))} — ${top}`);
  }
  return lines;
}

const largest = output => [...output]
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, LARGEST)
  .map(({ bytes, path }) => `\`${path}\` ${formatBytes(bytes)}`);

async function duplicates (output) {
  const groups = new Map;   // hash -> entries
  for (const entry of output) {
    if (entry.bytes < 1024) continue;   // tiny ones are not worth it
    const hash = createHash('sha1').update(await readFile(entry.file)).digest('hex');
    groups.set(hash, [...(groups.get(hash) ?? []), entry]);
  }

  const found  = [...groups.values()].filter(group => group.length > 1);
  if (!found.length) return [];
  const wasted = found.reduce((total, group) => total + group[0].bytes * (group.length - 1), 0);

  return [
    `${plural(found.length, 'content')} more than once, ${formatBytes(wasted)} that could go`,
    ...found
      .sort((a, b) => b[0].bytes * (b.length - 1) - a[0].bytes * (a.length - 1))
      .slice(0, DUPLICATES)
      .map(group => `${formatBytes(group[0].bytes)} × ${group.length}: ${group.map(entry => `\`${entry.path}\``).join(', ')}`),
  ];
}

async function network (output, skipped) {
  const hosts = new Map;   // host -> files
  for (const { file, path } of output) {
    if (!isText(file) || skipped.some(prefix => path.startsWith(prefix))) continue;
    for (const [, host] of (await readText(file)).matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})\//g)) {
      if (!hosts.has(host)) hosts.set(host, new Set);
      hosts.get(host).add(path);
    }
  }

  const list = paths => [...paths].sort().slice(0, 4).join(', ') + (paths.size > 4 ? ` … (${paths.size} files)` : '');
  return [...hosts].sort(([a], [b]) => a.localeCompare(b)).map(([host, paths]) => `\`${host}\` — ${list(paths)}`);
}

async function report ({ config, input, out, report: add }) {
  const skipped = [config.packages?.path ?? '/_pkg', config.vendor?.path ?? '/_vendor'].map(path => path.replace(/\/+$/, '') + '/');
  const output  = await inventory(out);
  const put     = (title, lines) => { if (lines.length) add(title, lines); };

  put('files',      files(input, output));
  put('compressed', await compressed(output));
  put('areas',      areas(output, skipped));
  put('largest',    largest(output));
  put('duplicates', await duplicates(output));
  put('network',    await network(output, skipped));
}

export { report };
export default report;
