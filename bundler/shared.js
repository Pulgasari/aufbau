// @aufbau/bundler/shared.js
// what the steps share: named file, path and process helpers over node's apis,
// so a step reads as what it does. the only module that imports from node:*.

import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { appendFile, cp, mkdir, readdir, readFile, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// :::::: CONSTANTS

// files whose content the steps read and rewrite
const TEXT = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.txt']);

// never shipped: history, tooling, demo sites, tests and parked code
const SKIP = new Set(['.git', '.github', '.trash', '_', 'node_modules', 'test', 'tests', 'www']);

// scoped registries next to npm's
const REGISTRIES = { '@jsr': 'https://npm.jsr.io' };

// :::::: PATHS

/*
// Curried path builder
const joinedPath = (...args) => (...segments) => join(...args, ...segments);
const removePath = (...args) => (...segments) => rm(joinedPath(...args)(...segments), { force: true, recursive: true });

const joinedPath = (...args) => (...segments) => join(...segments) (...args);
const removePath = (...segments) => (path) => rm(path, { force: true, recursive: true });
*/
/*
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
const joinedPath = (...base) => (...sub) => join(...base, ...sub);
// Curried path remover: creates a remover function bound to base segments
const removePath = (...base) => {
  const getPath = joinedPath(...base);
  return (...sub) => rm(getPath(...sub), { force: true, recursive: true });
};
// Usage:
const removeInDist = removePath('project', 'dist');
// Removes 'project/dist/cache' recursively
await removeInDist('cache'); 
// Removes 'project/dist' completely if no arguments are passed
await removeInDist(); 


import { rm } from 'node:fs/promises';
// Higher-order function: wraps any path-generating function into a remover
const createRemover = (pathFn) => (...sub) => rm(pathFn(...sub), { force: true, recursive: true });
// Usage:
const distPath       = joinedPath('project', 'dist');
const removeDistPath = createRemover(distPath);
// Removes 'project/dist/temp'
await removeDistPath('temp'); 
*/


const directoryOf  = path => dirname(path);
const extensionOf  = path => extname(path);
const joinPath     = (...parts) => join(...parts);
const relativePath = (from, to) => relative(from, to);
const resolvePath  = (...parts) => resolve(...parts);

// a file of the output as the page sees it, '/_pkg/aufbau/css/aufbau.css'
const outputPath = (out, path) => '/' + relative(out, path).split(sep).join('/');

const isText = path => TEXT.has(extname(path));

// :::::: FILE SYSTEM

const pathExists  = path => existsSync(path);
const isDirectory = path => existsSync(path) && statSync(path).isDirectory();
const isFile      = path => existsSync(path) && statSync(path).isFile();

const appendText    = (path, text) => appendFile(path, text);
const makeDirectory = path => mkdir(path, { recursive: true });
const readDirectory = path => readdir(path, { withFileTypes: true });
const readJson      = async path => JSON.parse(await readFile(path, 'utf8'));
const readText      = path => readFile(path, 'utf8');
const removePath    = path => rm(path, { force: true, recursive: true });
const writeText     = (path, text) => writeFile(path, text);

// symlinks are followed, a local checkout linked in is copied as files. `skip`
// holds names left out wherever they occur
const copyPath = (from, to, { skip = new Set } = {}) => cp(from, to, {
  dereference : true,
  filter      : source => !skip.has(source.split(sep).pop()),
  recursive   : true,
});

// every file below a directory
async function listFiles (directory) {
  const files = [];
  for (const entry of await readDirectory(directory)) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path)); else files.push(path);
  }
  return files;
}

async function removeEmptyDirectories (directory) {
  for (const entry of await readDirectory(directory)) {
    if (entry.isDirectory()) await removeEmptyDirectories(join(directory, entry.name));
  }
  if (!(await readdir(directory)).length) await rmdir(directory);
}

// bytes of a file, or of everything below a directory
async function sizeOf (path) {
  if (!existsSync(path)) return 0;
  if (!statSync(path).isDirectory()) return (await stat(path)).size;
  let bytes = 0;
  for (const file of await listFiles(path)) bytes += (await stat(file)).size;
  return bytes;
}

const megabytes = bytes => (bytes / 1024 / 1024).toFixed(1);

// :::::: PROCESSES AND MODULES

const importFile = path => import(pathToFileURL(path).href);
const runCommand = (command, args, options = {}) => execFileSync(command, args, { stdio: 'pipe', ...options });

// installs `dependencies` ({ name: spec }) into a work directory under the system
// temp dir and returns its node_modules. one install for all of them, a failing
// one is retried per package to leave out only those that fail
async function install (name, dependencies, log = () => {}) {
  const directory = join(tmpdir(), `aufbau-bundler-${name}`);
  await makeDirectory(directory);
  await writeText(join(directory, '.npmrc'), Object.entries(REGISTRIES).map(([scope, url]) => `${scope}:registry=${url}`).join('\n') + '\n');

  const run = async packages => {
    await removePath(join(directory, 'node_modules'));
    await removePath(join(directory, 'package-lock.json'));
    await writeText(join(directory, 'package.json'), JSON.stringify({ dependencies: packages, name: `aufbau-bundler-${name}`, private: true }, null, 2));
    runCommand('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--silent'], { cwd: directory });
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

// :::::: TEXT

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// :::::: EXPORT

export {
  appendText,
  copyPath,
  directoryOf,
  escapeRegExp,
  extensionOf,
  importFile,
  install,
  isDirectory,
  isFile,
  isText,
  joinPath,
  listFiles,
  makeDirectory,
  megabytes,
  outputPath,
  pathExists,
  readDirectory,
  readJson,
  readText,
  relativePath,
  removeEmptyDirectories,
  removePath,
  resolvePath,
  runCommand,
  sizeOf,
  SKIP,
  TEXT,
  writeText,
};
