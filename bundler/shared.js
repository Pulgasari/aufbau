// @aufbau/bundler/shared.js
// file helpers the steps share. node only, the bundler runs at build time.

import { cp, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

// files whose content the steps read and rewrite
const TEXT = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.txt']);

// never shipped: history, tooling, demo sites, tests and parked code
const SKIP = new Set(['.git', '.github', '.trash', '_', 'node_modules', 'test', 'tests', 'www']);

const isText = file => TEXT.has(extname(file));

async function walk (directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}

// symlinks are followed, a local checkout linked in is copied as files
const copy = (from, to, skip = SKIP) => cp(from, to, {
  dereference : true,
  filter      : source => !skip.has(source.split('/').pop()),
  recursive   : true,
});

export { copy, isText, SKIP, TEXT, walk };
