// @aufbau/bundler/steps/vendor.js
// third-party modules from cdns (esm.sh, jsdelivr, unpkg) become local files. the
// cdns themselves are not needed: every url is read as an npm package, version and
// subpath, the packages are installed from the npm registry (jsr through
// npm.jsr.io), and esbuild builds one browser module per url. bare imports that
// the importmap maps stay bare, so a shared package (preact) stays one instance.
//
//   vendor: {
//     exclude   : [/eruda/],                        // urls left alone
//     hosts     : ['esm.sh', 'cdn.jsdelivr.net', 'unpkg.com'],
//     importmap : { imports: { … } },               // the map the project builds at runtime
//     inject    : imports => html,                  // how the local entries reach the pages
//     pages     : ['index.html'],
//     path      : '/_vendor',
//   }
//
// two sources of urls: the importmap entries on those hosts that the staged files
// name (a key no file mentions is left out), and full urls written in the staged
// files. the first are handed to the pages as an importmap of local entries,
// injected before anything else (`inject`, default a <script type="importmap">),
// the second are rewritten in place.
//
// kinds of urls:
//   module     esm.sh/<pkg>@<version>/<subpath>, jsdelivr /npm/<pkg>@<version>/+esm
//              -> one esbuild bundle
//   directory  an importmap prefix entry (key and url end in /)
//              -> every js file of that package directory
//   file       unpkg and jsdelivr urls of a concrete file or directory (css,
//              wasm loaders) -> copied as is, a js file with its whole directory
//              (wasm siblings)
//
// esbuild comes from the bundler's own dependencies, loaded only by this step.

import { existsSync } from 'node:fs';
import { cp, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { install, walk } from './../shared.js';

const HOSTS   = ['cdn.jsdelivr.net', 'esm.sh', 'unpkg.com'];
const SCANNED = new Set(['.css', '.html', '.js', '.mjs']);

// :::::: PARSE

// <name>@<version>/<subpath> with an optional @scope, the version optional
function splitPackage (path) {
  const match = path.match(/^((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?(?:\/(.*))?$/);
  return match ? { name: match[1], subpath: match[3] ?? '', version: match[2] ?? '*' } : null;
}

function parse (url, isDirectory = false) {
  let address;
  try { address = new URL(url); } catch { return null; }
  let path = decodeURIComponent(address.pathname).replace(/^\/+/, '');

  if (address.host === 'cdn.jsdelivr.net') {
    if (!path.startsWith('npm/')) return null;
    path = path.slice(4);
  }

  // esm.sh/jsr/@scope/name is the jsr package, on npm as @jsr/scope__name. the
  // bare esm.sh/jsr is a base url a project builds on, no package
  if (address.host === 'esm.sh' && path.replace(/\/+$/, '') === 'jsr') return null;
  if (address.host === 'esm.sh' && path.startsWith('jsr/@')) path = path.slice(4).replace(/^@([^/]+)\/([^/@]+)/, '@jsr/$1__$2');

  const found = splitPackage(path);
  if (!found || !found.name) return null;

  const esm     = found.subpath === '+esm' || found.subpath.endsWith('/+esm');
  const subpath = found.subpath.replace(/\/?\+esm$/, '').replace(/\/+$/, '');
  const kind    = isDirectory ? 'directory'
                : address.host === 'unpkg.com' || (address.host === 'cdn.jsdelivr.net' && !esm && extname(subpath)) ? 'file'
                : 'module';

  return { ...found, kind, subpath, url };
}

// :::::: INSTALL

// the first version of a name installs under its own name (packages import
// themselves by it), others under an alias
const installNameOf = (name, version, first) => first ? name : `v-${name.replace(/[@/]/g, '-').replace(/^-+/, '')}-${version.replace(/[^\w.]+/g, '_')}`;

// :::::: BUILD

// the folder of a package in the output, a url without a version reads as latest
const folderOf  = ({ name, version }) => `${name}@${version === '*' ? 'latest' : version}`;
const moduleOut = module => join(folderOf(module), module.subpath ? module.subpath.replace(/\.(m?js)$/, '') : 'index') + '.js';

async function jsFiles (directory) {
  if (!existsSync(directory)) return [];
  return (await walk(directory)).filter(file => /\.m?js$/.test(file));
}

// :::::: STEP

async function vendor ({ config, log, out, report }) {
  if (!config.vendor) return;
  const {
    exclude   = [],
    hosts     = HOSTS,
    importmap = { imports: {} },
    inject    = imports => `<script type="importmap">${JSON.stringify({ imports })}</script>`,
    pages     = ['index.html'],
    path      = '/_vendor',
  } = config.vendor;

  const onHost   = url => { try { return hosts.includes(new URL(url).host); } catch { return false; } };
  const excluded = url => exclude.some(pattern => pattern.test(url));
  const texts    = (await walk(out)).filter(file => SCANNED.has(extname(file)));

  // the staged code, to tell used importmap keys and find written urls
  const sources = new Map;
  for (const file of texts) sources.set(file, await readFile(file, 'utf8'));
  const code = [...sources.values()].join('\n');

  // :::::: COLLECT

  const entries = Object.entries(importmap.imports ?? {})
    .filter(([key, url]) => onHost(url) && !excluded(url))
    .filter(([key]) => code.includes(`'${key}`) || code.includes(`"${key}`) || code.includes(`\`${key}`));

  // a url followed by ${ is a template, the importmap covers those
  const written = new Set;
  for (const text of sources.values()) {
    for (const match of text.matchAll(/https:\/\/[a-z0-9.-]+\/[^\s'"`)$<>\\]+/g)) {
      const url = match[0].replace(/[.,;]+$/, '');
      if (text[match.index + match[0].length] === '$' || !onHost(url) || excluded(url)) continue;
      written.add(url);
    }
  }

  const modules = new Map;   // url -> parsed
  for (const [key, url] of entries) { const parsed = parse(url, key.endsWith('/')); if (parsed) modules.set(url, parsed); }
  for (const url of written) if (!modules.has(url)) { const parsed = parse(url); if (parsed) modules.set(url, parsed); }
  if (!modules.size) return;

  // :::::: INSTALL

  const packages = [], installNames = new Map;   // name@version -> install name
  for (const { name, version } of modules.values()) {
    const id = `${name}@${version}`;
    if (installNames.has(id)) continue;
    const first = ![...installNames.keys()].some(known => known.startsWith(`${name}@`));
    const install = installNameOf(name, version, first);
    installNames.set(id, install);
    packages.push({ install, name, version });
  }

  const dependencies = Object.fromEntries(packages.map(({ install: key, name, version }) => [key, key === name ? version : `npm:${name}@${version}`]));
  const { directory, failed: failedInstalls, modules: modulesDirectory } = await install('vendor', dependencies, log);

  // :::::: BUILD

  const { build } = await import('esbuild');
  const external  = Object.keys(importmap.imports ?? {}).map(key => key.endsWith('/') ? `${key}*` : key);
  const target    = join(out, path);
  const local     = new Map;   // url -> local path
  const failed    = [...failedInstalls];

  for (const [url, module] of modules) {
    const installName = installNames.get(`${module.name}@${module.version}`);
    const source      = join(modulesDirectory, installName);
    if (!existsSync(source)) { failed.push(url); continue; }

    try {
      if (module.kind === 'file') {
        const file = join(source, module.subpath);
        const into = join(target, folderOf(module), module.subpath);
        if ((await stat(file)).isDirectory()) await cp(file, into, { recursive: true });
        else if (extname(file) === '.js')     await cp(dirname(file), dirname(into), { recursive: true });
        else                                  await cp(file, into);
        local.set(url, `${path}/${folderOf(module)}/${module.subpath}`);
      }
      else if (module.kind === 'directory') {
        const files = await jsFiles(join(source, module.subpath));
        if (!files.length) throw new Error('no js files');
        const outdir = join(target, folderOf(module), module.subpath);
        await build({ bundle: true, entryPoints: files, external, format: 'esm', logLevel: 'silent', minify: true, outdir, platform: 'browser' });
        local.set(url, `${path}/${folderOf(module)}/${module.subpath}/`);
      }
      else {
        const outfile = join(target, moduleOut(module));
        await build({ absWorkingDir: directory, bundle: true, entryPoints: [module.subpath ? `${installName}/${module.subpath}` : installName], external, format: 'esm', logLevel: 'silent', minify: true, outfile, platform: 'browser' });
        local.set(url, `${path}/${relative(target, outfile).split('\\').join('/')}`);
      }
    }
    catch (error) {
      failed.push(`${url} (${String(error.message).split('\n')[0]})`);
    }
  }

  // :::::: REWRITE

  // written urls in place, the longest first so none is cut into by a shorter one
  const byLength = [...local].filter(([url]) => written.has(url)).sort(([a], [b]) => b.length - a.length);
  for (const [file, text] of sources) {
    let next = text;
    for (const [url, path] of byLength) next = next.replaceAll(url, path);
    if (next !== text) await writeFile(file, next);
  }

  // the importmap entries as local overrides, ahead of everything in the pages
  const imports = Object.fromEntries(entries.filter(([, url]) => local.has(url)).map(([key, url]) => [key, local.get(url)]));
  if (Object.keys(imports).length) {
    for (const page of pages) {
      const file = join(out, page);
      if (!existsSync(file)) continue;
      await writeFile(file, (await readFile(file, 'utf8')).replace(/<head>/, `<head>\n  ${inject(imports)}`));
    }
  }

  // :::::: REPORT

  let bytes = 0;
  if (existsSync(target)) for (const file of await walk(target)) bytes += (await stat(file)).size;

  log(`vendor ${local.size} of ${modules.size} urls -> ${path}`);
  report('vendor', [
    `local: ${local.size} of ${modules.size} urls, ${(bytes / 1024 / 1024).toFixed(1)} mb (${Object.keys(imports).length} importmap entries, ${byLength.length} written urls)`,
    ...failed.map(entry => `**not vendored**: ${entry}`),
  ]);
}

export { parse, vendor };
export default vendor;
