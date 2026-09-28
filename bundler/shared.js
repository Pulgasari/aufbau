// @aufbau/bundler/shared.js
// file helpers the steps share. node only, the bundler runs at build time.

import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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

// scoped registries next to npm's
const REGISTRIES = { '@jsr': 'https://npm.jsr.io' };

// installs `dependencies` ({ name: spec }) into a work directory under the system
// temp dir and returns its node_modules. one install for all of them, a failing
// one is retried per package to leave out only those that fail
async function install (name, dependencies, log = () => {}) {
  const directory = join(tmpdir(), `aufbau-bundler-${name}`);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, '.npmrc'), Object.entries(REGISTRIES).map(([scope, url]) => `${scope}:registry=${url}`).join('\n') + '\n');

  const run = async packages => {
    await rm(join(directory, 'node_modules'), { force: true, recursive: true });
    await rm(join(directory, 'package-lock.json'), { force: true });
    await writeFile(join(directory, 'package.json'), JSON.stringify({ dependencies: packages, name: `aufbau-bundler-${name}`, private: true }, null, 2));
    execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--silent'], { cwd: directory, stdio: 'pipe' });
  };

  const failed = [];
  try { await run(dependencies); }
  catch {
    log(`${name}: the joint install failed, trying the packages one by one`);
    const working = {};
    for (const [key, spec] of Object.entries(dependencies)) {
      try   { await run({ ...working, [key]: spec }); working[key] = spec; }
      catch { failed.push(`${key}@${spec}`); }
    }
    await run(working);
  }

  return { directory, failed, modules: join(directory, 'node_modules') };
}

export { copy, install, isText, SKIP, TEXT, walk };
