// @aufbau/bundler/steps/prune.js
// drops every file nothing reaches. reachable is what the pages load, followed
// through the files they load:
//
//   prune: {
//     entries : ['/notes/app.js'],                 // loaded by a path built at runtime
//     keep    : ['/.shared/js/components/'],       // directories loaded by name, kept whole
//     origins : ['https://zugriff.dev'],           // urls on these hosts are the output itself
//   }
//
// what counts as a reference, in a reachable file:
//   js    static imports, dynamic imports with a literal, and any quoted string
//         that is an importmap key or names a file of the output
//   css   @import and url()
//   html  quoted strings (src, href, inline scripts)
//
// a quoted path is resolved from the root when it starts with /, else from the
// file's directory. bare specifiers go through the importmap the vendor step left
// (or `importmap` in this config), a prefix entry whose key is quoted keeps its
// whole directory. importmap targets are only reached through their keys, so a
// map written into a page does not keep everything it lists.
//
// imports by a name built at runtime (a component loader, an app's views) are
// what `keep` is for, until a manifest replaces the convention.

import { existsSync, statSync } from 'node:fs';
import { readFile, rm, rmdir, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';
import { walk } from './../shared.js';

const QUOTED = /(["'`])((?:(?!\1)[^\n\\$])+?)\1/g;
const CSSURL = /(?:@import\s+(?:url\(\s*)?|url\(\s*)(["']?)([^"')\s;]+)\1/g;

// :::::: HELPERS

const isFile = path => existsSync(path) && statSync(path).isFile();

async function removeEmptyDirectories (directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) await removeEmptyDirectories(join(directory, entry.name));
  }
  if (!(await readdir(directory)).length) await rmdir(directory);
}

// :::::: STEP

async function prune (context) {
  const { config, log, out, report } = context;
  if (!config.prune) return;
  const { entries = [], keep = [], origins = [] } = config.prune;

  const { init, parse } = await import('es-module-lexer');
  await init;

  const imports   = (config.prune.importmap ?? context.importmap)?.imports ?? {};
  const keys      = Object.keys(imports).sort((a, b) => b.length - a.length);   // longest prefix first
  const targets   = new Set(Object.values(imports).map(url => url.replace(/\/+$/, '')));
  const pages     = config.prune.pages ?? ['index.html'];

  // a url or path as a file of the output, or null
  const local = (reference, from) => {
    let path = reference.split(/[?#]/)[0];
    if (!path) return null;
    const origin = origins.find(origin => path.startsWith(origin + '/'));
    if (origin) path = path.slice(origin.length);
    if (/^[a-z]+:|^\/\//i.test(path)) return null;
    return path.startsWith('/') ? join(out, path) : join(dirname(from), path);
  };

  // a bare specifier through the importmap: the file, or a directory for a prefix entry
  const mapped = specifier => {
    const key = keys.find(key => key === specifier || (key.endsWith('/') && specifier.startsWith(key)));
    if (!key) return null;
    return { directory: key.endsWith('/') && specifier === key, url: key.endsWith('/') ? imports[key] + specifier.slice(key.length) : imports[key] };
  };

  // :::::: WALK

  const reached = new Set;
  const queue   = [];
  const reach   = path => { if (path && !reached.has(path) && isFile(path)) { reached.add(path); queue.push(path); } };

  const reachDirectory = async directory => {
    if (!existsSync(directory) || !statSync(directory).isDirectory()) return;
    for (const file of await walk(directory)) reach(file);
  };

  const reachSpecifier = async (specifier, from) => {
    const target = mapped(specifier);
    if (target) {
      const path = local(target.url, from);
      if (target.directory) await reachDirectory(path); else reach(path);
      return;
    }
    if (/^[./]/.test(specifier) || /^https?:/.test(specifier)) reach(local(specifier, from));
  };

  // a quoted string: an importmap key, a file of the output, or neither. paths
  // that are importmap targets only count through their keys
  const reachString = async (value, from) => {
    if (mapped(value)) return reachSpecifier(value, from);
    if (!/[./]/.test(value) || value.length > 300) return;
    const path = local(value, from);
    if (!path || targets.has('/' + relative(out, path).split(sep).join('/'))) return;
    reach(path);
  };

  for (const page of pages) reach(join(out, page));
  for (const entry of entries) reach(join(out, entry));
  for (const directory of keep) await reachDirectory(join(out, directory));

  while (queue.length) {
    const file = queue.shift();
    const type = extname(file);
    if (!['.css', '.html', '.js', '.json', '.mjs'].includes(type)) continue;
    const text = await readFile(file, 'utf8');

    if (type === '.css') {
      for (const [, , reference] of text.matchAll(CSSURL)) reach(local(reference, file));
      continue;
    }

    if (type === '.js' || type === '.mjs') {
      try {
        const [found] = parse(text);
        for (const { n: specifier } of found) if (specifier) await reachSpecifier(specifier, file);
      } catch { /* not parseable as a module, the strings below still count */ }
    }

    for (const [, , value] of text.matchAll(QUOTED)) await reachString(value, file);
  }

  // :::::: DROP

  let removed = 0, bytes = 0;
  const dropped = new Map;   // top two path segments -> bytes
  for (const file of await walk(out)) {
    if (reached.has(file)) continue;
    const size = (await stat(file)).size;
    const area = relative(out, file).split(sep).slice(0, 2).join('/');
    dropped.set(area, (dropped.get(area) ?? 0) + size);
    removed++; bytes += size;
    await rm(file);
  }
  await removeEmptyDirectories(out);

  const mb = value => (value / 1024 / 1024).toFixed(1);
  log(`prune ${removed} files, ${mb(bytes)} mb`);
  report('prune', [
    `kept ${reached.size} files, dropped ${removed} (${mb(bytes)} mb)`,
    ...[...dropped].sort(([, a], [, b]) => b - a).slice(0, 8).map(([area, size]) => `\`${area}\` −${mb(size)} mb`),
  ]);
}

export { prune };
export default prune;
