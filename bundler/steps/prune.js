// @aufbau/bundler/steps/prune.js
// drops every file nothing reaches. reachable is what the pages load, followed
// through the files they load:
//
//   prune: {
//     entries : ['/notes/app.js'],                 // loaded by a path built at runtime
//     exclude : ['@aufbau/devtools'],              // specifiers and paths that reach nothing
//     keep    : ['/notes/'],                       // directories kept whole
//     loaders : { 'zugriff.component': '/.shared/js/components/{name}.js' },
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
// map written into a page does not keep everything it lists, and the keys in the
// file that defines the map (one naming at least half of them) count as no use.
//
// a loader that imports by a name, `zugriff.component('Icon')`, is declared in
// `loaders` with the path its names stand for: every string argument of a call
// in a reachable file reaches that path (an argument that names no file, like a
// member to pick, is ignored). what is loaded by a name that is never written
// out goes into `keep` or `entries`.
//
// packages declare their own runtime paths (see the packages step), those are
// kept once a file of the declaring package is reached.
//
// `exclude` cuts a part off on purpose (devtools in a release build): a
// specifier or output path starting with an entry reaches nothing.
//
// BUNDLER_WHY=<output path> logs the chain a file was reached through.

import {
  directoryOf, escapeRegExp, extensionOf, isDirectory, isFile, joinPath, listFiles, megabytes,
  outputPath, readText, removeEmptyDirectories, removePath, sizeOf,
} from './../shared.js';

const QUOTED = /(["'`])((?:(?!\1)[^\n\\$])+?)\1/g;
const CSSURL = /(?:@import\s+(?:url\(\s*)?|url\(\s*)(["']?)([^"')\s;]+)\1/g;
const READ   = new Set(['.css', '.html', '.js', '.json', '.mjs']);

async function prune (context) {
  const { config, log, out, report } = context;
  if (!config.prune) return;
  const { entries = [], exclude = [], keep = [], loaders = {}, origins = [], pages = ['index.html'] } = config.prune;

  const { init, parse } = await import('es-module-lexer');
  await init;

  const imports      = (config.prune.importmap ?? context.importmap)?.imports ?? {};
  const keys         = Object.keys(imports).sort((a, b) => b.length - a.length);   // longest prefix first
  const targets      = new Set(Object.values(imports).map(url => url.replace(/\/+$/, '')));
  const declarations = [...(context.declarations ?? [])];

  // `<call>(` not preceded by more of a name, its arguments up to the closing parenthesis
  const calls = Object.entries(loaders).map(([call, path]) => ({ path, pattern: new RegExp(`(?<![\\w$.])${escapeRegExp(call)}\\s*\\(([^)]*)\\)`, 'g') }));

  const excluded = reference => exclude.some(prefix => reference.startsWith(prefix));

  // :::::: RESOLVE

  // a url or path as a file of the output, or null
  const local = (reference, from) => {
    let path = reference.split(/[?#]/)[0];
    if (!path) return null;
    const origin = origins.find(origin => path.startsWith(origin + '/'));
    if (origin) path = path.slice(origin.length);
    if (/^[a-z]+:|^\/\//i.test(path)) return null;
    return path.startsWith('/') ? joinPath(out, path) : joinPath(directoryOf(from), path);
  };

  // a bare specifier through the importmap: the file, or a directory for a prefix entry
  const mapped = specifier => {
    const key = keys.find(key => key === specifier || (key.endsWith('/') && specifier.startsWith(key)));
    if (!key) return null;
    return { directory: key.endsWith('/') && specifier === key, url: key.endsWith('/') ? imports[key] + specifier.slice(key.length) : imports[key] };
  };

  // :::::: WALK

  // file -> the file it was first reached from, for BUNDLER_WHY
  const reached = new Map;
  const queue   = [];
  let   current = null;

  const reach = path => {
    if (!path || reached.has(path) || !isFile(path) || excluded(outputPath(out, path))) return;
    reached.set(path, current);
    queue.push(path);
  };

  const reachDirectory = async directory => {
    if (!isDirectory(directory)) return;
    for (const file of await listFiles(directory)) reach(file);
  };

  const reachSpecifier = async (specifier, from) => {
    if (excluded(specifier)) return;
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
    if (!path || targets.has(outputPath(out, path))) return;
    reach(path);
  };

  // a declaration applies from the first reached file of its package on
  const applyDeclarations = async file => {
    const path = outputPath(out, file);
    for (const declaration of declarations.filter(({ owner }) => path.startsWith(owner))) {
      declarations.splice(declarations.indexOf(declaration), 1);
      for (const kept of declaration.keep) {
        const path = joinPath(out, kept);
        if (isDirectory(path)) await reachDirectory(path); else reach(path);
      }
    }
  };

  for (const page of pages) reach(joinPath(out, page));
  for (const entry of entries) reach(joinPath(out, entry));
  for (const directory of keep) await reachDirectory(joinPath(out, directory));

  while (queue.length) {
    const file = current = queue.shift();
    await applyDeclarations(file);
    if (!READ.has(extensionOf(file))) continue;

    let text = await readText(file);
    for (const snippet of context.injected ?? []) text = text.replace(snippet, '');

    if (extensionOf(file) === '.css') {
      for (const [, , reference] of text.matchAll(CSSURL)) reach(local(reference, file));
      continue;
    }

    if (['.js', '.mjs'].includes(extensionOf(file))) {
      for (const { path, pattern } of calls) {
        for (const [, args] of text.matchAll(pattern)) {
          for (const [, , name] of args.matchAll(/(["'`])([\w./-]+)\1/g)) reach(local(path.replaceAll('{name}', name), file));
        }
      }

      try {
        const [found] = parse(text);
        for (const { n: specifier } of found) if (specifier) await reachSpecifier(specifier, file);
      } catch { /* not parseable as a module, the strings below still count */ }
    }

    // the file that writes the importmap names all of its keys, that is no use of them
    const strings  = [...text.matchAll(QUOTED)].map(([, , value]) => value);
    const defining = keys.length && strings.filter(value => Object.hasOwn(imports, value)).length >= keys.length / 2;
    for (const value of strings) if (!(defining && Object.hasOwn(imports, value))) await reachString(value, file);
  }

  if (process.env.BUNDLER_WHY) {
    const chain = [];
    for (let file = joinPath(out, process.env.BUNDLER_WHY); file; file = reached.get(file)) chain.push(outputPath(out, file));
    log(`why ${chain.join(' <- ')}`);
  }

  // :::::: DROP

  let removed = 0, bytes = 0;
  const dropped = new Map;   // top two path segments -> bytes
  for (const file of await listFiles(out)) {
    if (reached.has(file)) continue;
    const size = await sizeOf(file);
    const area = outputPath(out, file).split('/').slice(1, 3).join('/');
    dropped.set(area, (dropped.get(area) ?? 0) + size);
    removed++; bytes += size;
    await removePath(file);
  }
  await removeEmptyDirectories(out);

  log(`prune ${removed} files, ${megabytes(bytes)} mb`);
  report('prune', [
    `kept ${reached.size} files, dropped ${removed} (${megabytes(bytes)} mb)`,
    ...(exclude.length ? [`excluded: ${exclude.map(entry => `\`${entry}\``).join(', ')}`] : []),
    ...[...dropped].sort(([, a], [, b]) => b - a).slice(0, 8).map(([area, size]) => `\`${area}\` −${megabytes(size)} mb`),
  ]);
}

export { prune };
export default prune;
