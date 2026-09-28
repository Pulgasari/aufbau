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

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { copy, isText, walk } from './../shared.js';

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function reposIn (out, origin) {
  const repos   = new Set;
  const pattern = new RegExp(`(?:${escape(origin)}|\\$\\{pkg\\})/([\\w.-]+)/`, 'g');
  for (const file of await walk(out)) {
    if (!isText(file)) continue;
    for (const [, repo] of (await readFile(file, 'utf8')).matchAll(pattern)) repos.add(repo);
  }
  return [...repos].sort();
}

async function packages ({ config, log, out, report, root }) {
  if (!config.packages) return;
  const { clone, origin, path = '/_pkg', source = '_pkg' } = config.packages;
  const base = origin.replace(/\/+$/, '');

  const staged = [], missing = [];
  for (const repo of await reposIn(out, base)) {
    const checkout = join(root, source, repo);
    if (!existsSync(checkout) && clone) {
      try   { execFileSync('git', ['clone', '--quiet', '--depth', '1', clone.replaceAll('{repo}', repo), checkout], { stdio: 'inherit' }); }
      catch { /* private or gone, reported below */ }
    }
    if (!existsSync(checkout)) { missing.push(repo); continue; }
    await copy(checkout, join(out, path, repo));
    staged.push(repo);
  }

  // after the copies, so the packages' own mentions of the origin move along
  for (const file of await walk(out)) {
    if (!isText(file)) continue;
    const text = await readFile(file, 'utf8');
    const next = text.replaceAll(base, path);
    if (next !== text) await writeFile(file, next);
  }

  log(`packages ${staged.join(', ') || 'none'} -> ${path}`);
  report('packages', [
    `local: ${staged.join(', ') || 'none'}`,
    ...(missing.length ? [`**missing** (no checkout, not clonable): ${missing.join(', ')}`] : []),
  ]);
}

export { packages };
export default packages;
