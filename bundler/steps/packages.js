// @aufbau/bundler/steps/packages.js
// the first-party packages a project loads become local copies in the output.
// two ways a project names them:
//
// by origin: a package origin (e.g. code.pulgasari.dev, one repo per path
// segment) in the copied files. the repos found there are copied whole, and
// every mention of the origin points at the copies:
//
//   packages: {
//     clone  : 'https://github.com/owner/{repo}.git',   // for a repo missing in source
//     origin : 'https://code.pulgasari.dev',
//     path   : '/_pkg',                                // where the copies go, and the new origin
//     source : 'build/_pkg',                           // local checkouts, one directory per repo
//   }
//
// the repos are found in the copied files: `${origin}/<repo>/…`, and `${pkg}/<repo>/…`
// for an importmap that keeps its origin in a `pkg` constant.
//
// by specifier: bare specifiers through the project's own importmap, whose
// targets are local paths of the output (`./vendor/@aufbau/gui/index.js`). the
// map stays as written and is inlined into the pages; a package is copied to the
// directory its targets name once the module graph reaches it:
//
//   packages: {
//     importmap : 'importmap.json',                  // a path (from root) or { imports }
//     sources   : { '@aufbau/*': { repo: 'aufbau', path: '*' } },   // a package -> its directory in a repo
//     source    : '_pkg',                            // local checkouts, one directory per repo
//     clone     : 'https://github.com/owner/{repo}.git',
//     pages     : ['index.html'],
//     strict    : true,                              // a graph problem fails the bundle
//   }
//
// the walk reports what does not hold offline: a bare specifier the map does not
// cover (unresolved), a module imported from a host (network), a relative import
// out of its package (escapes), a module file that is not there (missing).
//
// either way, a package names the paths it loads by names built at runtime in
// its own package.json, relative to itself:
//
//   "aufbau": { "bundle": { "keep": ["../css/"] } }
//
// they go into context.declarations as { owner, keep }, prune keeps them as soon
// as it reaches any file of the owning package.

import {
  copyPath, directoryOf, escapeRegExp, isFile, isText, joinPath, listFiles, outputPath, pathExists,
  readJson, readText, runCommand, SKIP, writeText,
} from './../shared.js';

// what a copy of a package leaves out besides SKIP: its tests
const TESTS = new Set([...SKIP, '__tests__']);

const cloneInto = (clone, repo, checkout) => {
  if (pathExists(checkout) || !clone) return;
  try   { runCommand('git', ['clone', '--quiet', '--depth', '1', clone.replaceAll('{repo}', repo), checkout], { stdio: 'inherit' }); }
  catch { /* private or gone, reported by the caller */ }
};

// what the package.json files of a copied directory declare, as output paths
async function declarationsIn (directory, out) {
  const declarations = [];
  for (const file of await listFiles(directory)) {
    if (!file.endsWith('package.json')) continue;
    let manifest;
    try { manifest = await readJson(file); } catch { continue; }
    const keep = manifest.aufbau?.bundle?.keep ?? [];
    if (!keep.length) continue;
    const owner = directoryOf(file);
    declarations.push({
      keep  : keep.map(path => outputPath(out, joinPath(owner, path)) + (path.endsWith('/') ? '/' : '')),
      owner : outputPath(out, owner) + '/',
    });
  }
  return declarations;
}

// :::::: BY ORIGIN

async function reposIn (out, origin) {
  const repos   = new Set;
  const pattern = new RegExp(`(?:${escapeRegExp(origin)}|\\$\\{pkg\\})/([\\w.-]+)/`, 'g');
  for (const file of await listFiles(out)) {
    if (!isText(file)) continue;
    for (const [, repo] of (await readText(file)).matchAll(pattern)) repos.add(repo);
  }
  return [...repos].sort();
}

async function byOrigin (context) {
  const { config, log, out, report, root } = context;
  const { clone, origin, path = '/_pkg', source = '_pkg' } = config.packages;
  const base = origin.replace(/\/+$/, '');

  const staged = [], missing = [];

  for (const repo of await reposIn(out, base)) {
    const checkout = joinPath(root, source, repo);
    cloneInto(clone, repo, checkout);
    if (!pathExists(checkout)) { missing.push(repo); continue; }

    const copied = joinPath(out, path, repo);
    await copyPath(checkout, copied, { skip: SKIP });
    context.declarations.push(...await declarationsIn(copied, out));
    staged.push(repo);
  }

  // after the copies, so the packages' own mentions of the origin move along
  for (const file of await listFiles(out)) {
    if (!isText(file)) continue;
    const text = await readText(file);
    const next = text.replaceAll(base, path);
    if (next !== text) await writeText(file, next);
  }

  log(`packages ${staged.join(', ') || 'none'} -> ${path}`);
  report('packages', [
    `local: ${staged.join(', ') || 'none'}`,
    ...context.declarations.map(({ keep, owner }) => `\`${owner}\` keeps ${keep.map(path => `\`${path}\``).join(', ')}`),
    ...(missing.length ? [`**missing** (no checkout, not clonable): ${missing.join(', ')}`] : []),
  ]);
}

// :::::: BY SPECIFIER

// '@scope/name' in a target path: the package and the directory it lives in,
// relative to the page ('./vendor/@aufbau/gui/')
const PACKAGE_DIRECTORY = /^(.*?\/)?(@[^/]+\/[^/]+)\//;

const packageOfTarget = target => {
  const match = PACKAGE_DIRECTORY.exec(target);
  return match && { directory: (match[1] ?? '') + match[2] + '/', name: match[2] };
};

// '@aufbau/gui' -> { repo, path } through the first matching `sources` pattern
function sourceOf (sources, name) {
  for (const [pattern, { path, repo }] of Object.entries(sources)) {
    if (pattern === name) return { path, repo };
    if (pattern.endsWith('/*') && name.startsWith(pattern.slice(0, -1))) {
      const rest = name.slice(pattern.length - 1);
      return { path: path.replaceAll('*', rest), repo: repo.replaceAll('*', rest) };
    }
  }
  return null;
}

// the module scripts of a page: src paths and inline code
function modulesOfPage (html) {
  const sources = [], inline = [];
  for (const [, attributes, code] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/type\s*=\s*["']?module/i.test(attributes)) continue;
    const src = /src\s*=\s*["']([^"']+)["']/i.exec(attributes)?.[1];
    if (src) sources.push(src); else inline.push(code);
  }
  return { inline, sources };
}

async function bySpecifier (context) {
  const { config, log, out, report, root } = context;
  const { clone, pages = ['index.html'], source = '_pkg', sources = {}, strict = false } = config.packages;
  const map = typeof config.packages.importmap === 'string'
    ? await readJson(joinPath(root, config.packages.importmap))
    : config.packages.importmap;
  const imports = map.imports ?? {};
  const keys    = Object.keys(imports).sort((a, b) => b.length - a.length);   // longest prefix first

  const { init, parse } = await import('es-module-lexer');
  await init;

  // a bare specifier through the map: the target, relative to the page
  const mapped = specifier => {
    const key = keys.find(key => key === specifier || (key.endsWith('/') && specifier.startsWith(key)));
    return key ? (key.endsWith('/') ? imports[key] + specifier.slice(key.length) : imports[key]) : null;
  };
  const local = path => joinPath(out, path.replace(/^\.?\//, ''));

  // :::::: STAGE

  const staged   = new Map;   // name -> output directory
  const problems = { escapes: [], missing: [], network: [], unresolved: [] };
  const problem  = (kind, line) => { if (!problems[kind].includes(line)) problems[kind].push(line); };

  async function stage ({ directory, name }) {
    if (staged.has(name)) return true;
    const found = sourceOf(sources, name);
    if (!found) { problem('missing', `\`${name}\`: no entry in sources`); staged.set(name, null); return false; }

    const checkout = joinPath(root, source, found.repo);
    cloneInto(clone, found.repo, checkout);
    const from = joinPath(checkout, found.path);
    if (!pathExists(from)) { problem('missing', `\`${name}\`: ${from} not found`); staged.set(name, null); return false; }

    const to = local(directory);
    await copyPath(from, to, { skip: TESTS });
    context.declarations.push(...await declarationsIn(to, out));
    staged.set(name, to);
    return true;
  }

  // the package directory a staged file belongs to, for the escapes check
  const ownerOf = file => [...staged.values()].find(directory => directory && file.startsWith(directory + '/'));

  // :::::: WALK

  const seen = new Set, queue = [];
  const visit = (file, from) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (!isFile(file)) { problem('missing', `${outputPath(out, file)} (from ${from})`); return; }
    queue.push(file);
  };

  async function follow (specifier, file, label) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(specifier)) {
      if (/^https?:/i.test(specifier)) problem('network', `\`${specifier}\` in ${label}`);
      return;
    }
    if (/^[./]/.test(specifier)) {
      const target = specifier.startsWith('/') ? local(specifier) : joinPath(directoryOf(file), specifier);
      const owner  = ownerOf(file);
      if (owner && !target.startsWith(owner + '/')) problem('escapes', `\`${specifier}\` in ${label}`);
      return visit(target, label);
    }
    const target = mapped(specifier);
    if (!target) return problem('unresolved', `\`${specifier}\` in ${label}`);
    const owner = packageOfTarget(target.replace(/^\.?\//, ''));
    if (owner && !await stage(owner)) return;
    visit(local(target), label);
  }

  for (const page of pages) {
    const file = joinPath(out, page);
    if (!pathExists(file)) continue;
    const { inline, sources: scripts } = modulesOfPage(await readText(file));
    for (const src of scripts) await follow(src.startsWith('/') || src.startsWith('.') ? src : './' + src, file, page);
    for (const code of inline) {
      const [found] = parse(code);
      for (const { n: specifier } of found) if (specifier) await follow(specifier, file, page);
    }
  }

  while (queue.length) {
    const file = queue.shift();
    if (!/\.m?js$/.test(file)) continue;
    let found;
    try { [found] = parse(await readText(file)); } catch { continue; }
    for (const { n: specifier } of found) if (specifier) await follow(specifier, file, outputPath(out, file));
  }

  // :::::: INJECT

  // the map goes into every page that does not carry one, ahead of its scripts.
  // prune reads the pages without it: a map naming its keys is no use of them
  const snippet = `<script type="importmap">${JSON.stringify(map)}</script>`;
  for (const page of pages) {
    const file = joinPath(out, page);
    if (!pathExists(file)) continue;
    const html = await readText(file);
    if (/<script[^>]+type\s*=\s*["']?importmap/i.test(html)) continue;
    await writeText(file, html.replace(/<head>/i, `<head>\n  ${snippet}`));
  }
  context.injected = [...(context.injected ?? []), snippet];
  context.importmap = map;

  // :::::: REPORT

  const names  = [...staged].filter(([, directory]) => directory).map(([name]) => name).sort();
  const lines  = Object.entries(problems).flatMap(([kind, list]) => list.map(line => `**${kind}**: ${line}`));
  log(`packages ${names.length} by specifier, ${lines.length} problems`);
  report('packages', [
    `local: ${names.join(', ') || 'none'}`,
    `modules reached: ${seen.size}`,
    ...context.declarations.map(({ keep, owner }) => `\`${owner}\` keeps ${keep.map(path => `\`${path}\``).join(', ')}`),
    ...lines,
  ]);
  if (strict && lines.length) throw new Error(`packages: the module graph does not hold offline\n${lines.join('\n')}`);
}

// :::::: STEP

async function packages (context) {
  if (!context.config.packages) return;
  context.declarations ??= [];
  return context.config.packages.importmap ? bySpecifier(context) : byOrigin(context);
}

export { packages };
export default packages;
