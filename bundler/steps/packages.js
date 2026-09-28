// @aufbau/bundler/steps/packages.js
// the packages a project loads from a package origin (e.g. code.pulgasari.dev,
// which serves one repo per path segment) become local copies in the output, and
// every mention of the origin in the output points at them:
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
// a package names the paths it loads by names built at runtime in its own
// package.json, relative to itself:
//
//   "aufbau": { "bundle": { "keep": ["../css/"] } }
//
// they go into context.declarations as { owner, keep }, prune keeps them as soon
// as it reaches any file of the owning package.

import { copyPath, directoryOf, escapeRegExp, isText, joinPath, listFiles, outputPath, pathExists, readJson, readText, runCommand, SKIP, writeText } from './../shared.js';

async function reposIn (out, origin) {
  const repos   = new Set;
  const pattern = new RegExp(`(?:${escapeRegExp(origin)}|\\$\\{pkg\\})/([\\w.-]+)/`, 'g');
  for (const file of await listFiles(out)) {
    if (!isText(file)) continue;
    for (const [, repo] of (await readText(file)).matchAll(pattern)) repos.add(repo);
  }
  return [...repos].sort();
}

// what the package.json files of a copied repo declare, as output paths
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

async function packages (context) {
  const { config, log, out, report, root } = context;
  if (!config.packages) return;
  const { clone, origin, path = '/_pkg', source = '_pkg' } = config.packages;
  const base = origin.replace(/\/+$/, '');

  const staged = [], missing = [];
  context.declarations ??= [];

  for (const repo of await reposIn(out, base)) {
    const checkout = joinPath(root, source, repo);
    if (!pathExists(checkout) && clone) {
      try   { runCommand('git', ['clone', '--quiet', '--depth', '1', clone.replaceAll('{repo}', repo), checkout], { stdio: 'inherit' }); }
      catch { /* private or gone, reported below */ }
    }
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

export { packages };
export default packages;
