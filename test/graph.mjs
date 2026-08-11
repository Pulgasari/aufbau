// module graph measurement
//
// the kosmos ships unbundled esm, so the module graph IS the loading
// characteristic. this reports the three numbers that drive it:
//
//   count  how many requests a cold load makes
//   bytes  how much goes over the wire
//   depth  how many SEQUENTIAL round trips the browser needs, because it
//          cannot discover level n+1 before it has parsed level n
//
// depth is the one that hurts and the one no bandwidth fixes. see optimize.md.
//
// usage:
//   node test/graph.mjs                                  # default entry
//   node test/graph.mjs kits/aufbau.js                   # relative to aufbau/
//   node test/graph.mjs ../domina/core/index.js
//   node test/graph.mjs --map importmap2.js kits/aufbau.js

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::

const HERE = dirname(fileURLToPath(import.meta.url));

// published layout: pulgasari.github.io is the site root and aufbau/, bunker/
// and domina/ are directories inside it. locally they are sibling checkouts, so
// the parent of aufbau/ plays the role of the site root.
const ROOT  = resolve(HERE, '../..');
const ENTRY = 'kits/preact-htm.js';

// matches `import x from 'y'`, `export * from 'y'` and bare `import 'y'`.
// deliberately static: no code runs, so this is safe on any checkout.
const REGEX_IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;

// block comments are stripped first, otherwise the usage examples several
// packages carry at the bottom of the file count as real imports. line comments
// need no handling: the pattern above anchors `import` to the start of a line,
// so a commented-out `//import …` never matches.
const REGEX_BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;

// :::::: IMPORTMAP :::::::::::::::::::::::::::::::::::::::::::::

/*
  the injectors are classic scripts that build a map and append a
  <script type="importmap"> next to themselves. rather than duplicating their
  contents here — which would drift the moment anyone edits them — we run one
  against a stub document and keep whatever it emits.

  the injector rebases every entry against its own src, so it is told it lives
  at the site root. that makes './aufbau/js/index.js' land on the real checkout.
*/
function loadImportmap (file) {
  const source = readFileSync(join(ROOT, 'pulgasari.github.io', file), 'utf8');

  let captured = null;

  const script = {
    src   : pathToFileURL(join(ROOT, file)).href,
    after : (node) => { captured ??= node.textContent; },
  };

  const document = {
    currentScript          : script,
    createDocumentFragment : () => ({ childNodes: [], appendChild () {} }),
    createElement          : () => ({}),
    head                   : { appendChild () {} },
  };

  // the injector is an iife closing over `document` and `URL`
  new Function('document', 'URL', source)(document, URL);

  if (!captured) throw new Error(`[graph] ${file} emitted no importmap`);
  return JSON.parse(captured).imports ?? {};
}

/*
  the published site is the pulgasari.github.io checkout with aufbau/, bunker/,
  domina/ and friends mounted into it as directories. locally those are sibling
  checkouts, so a mapped path can live in either place — './aufbau/js/index.js'
  is a sibling, './js/str.js' belongs to the site repo itself.

  siblings win, matching the published layout; anything else falls back into the
  site checkout.
*/
function toLocalPath (url) {
  const path = fileURLToPath(url);
  if (existsSync(path)) return path;

  const inSite = join(ROOT, 'pulgasari.github.io', relative(ROOT, path));
  return existsSync(inSite) ? inSite : path;
}

/** importmap resolution: exact match wins, then the longest trailing-slash prefix. */
function resolveSpecifier (specifier, imports) {
  if (imports[specifier]) return imports[specifier];

  let match = null;
  for (const key in imports) {
    if (!key.endsWith('/') || !specifier.startsWith(key)) continue;
    if (!match || key.length > match.length) match = key;
  }

  return match ? imports[match] + specifier.slice(match.length) : null;
}

// :::::: WALK :::::::::::::::::::::::::::::::::::::::::::::::::::

function walk (entry, imports) {
  const bytes    = new Map; // file -> size
  const edges    = new Map; // file -> [file]
  const external = new Set;
  const missing  = new Set;
  const unmapped = new Set;

  const visit = (file) => {
    if (edges.has(file)) return;
    edges.set(file, []);

    if (!existsSync(file)) return missing.add(file);

    const source = readFileSync(file, 'utf8');
    bytes.set(file, Buffer.byteLength(source));

    for (const match of source.replace(REGEX_BLOCK_COMMENT, '').matchAll(REGEX_IMPORT)) {
      const specifier = match[1] ?? match[2];
      if (!specifier) continue;

      let target;
      if      (specifier.startsWith('.'))    target = resolve(dirname(file), specifier);
      else if (specifier.startsWith('http')) { external.add(specifier); continue; }
      else {
        const mapped = resolveSpecifier(specifier, imports);
        if (!mapped) { unmapped.add(`${specifier}  <- ${relative(ROOT, file)}`); continue; }
        if (!mapped.startsWith('file:'))     { external.add(mapped); continue; }
        target = toLocalPath(mapped);
      }

      edges.get(file).push(target);
      visit(target);
    }
  };

  visit(entry);

  // breadth-first: a module's level is the shortest import chain reaching it,
  // which is exactly how many round trips the browser needs to discover it
  const level = new Map([[entry, 0]]);
  const queue = [entry];

  while (queue.length) {
    const file = queue.shift();
    for (const child of edges.get(file) ?? []) {
      if (level.has(child)) continue;
      level.set(child, level.get(file) + 1);
      queue.push(child);
    }
  }

  // fan-in decides preload value independently of level: a module imported by
  // twenty others is worth pulling forward even if it sits deep
  const fanIn = new Map;
  for (const [, children] of edges) {
    for (const child of children) fanIn.set(child, (fanIn.get(child) ?? 0) + 1);
  }

  return { bytes, edges, external, fanIn, level, missing, unmapped };
}

// :::::: REPORT ::::::::::::::::::::::::::::::::::::::::::::::::

function report (entry, result) {
  const { bytes, external, fanIn, level, missing, unmapped } = result;

  const total = [...bytes.values()].reduce((sum, size) => sum + size, 0);
  const depth = Math.max(...level.values());

  console.log(`\nENTRY  ${relative(ROOT, entry)}`);
  console.log(`modules ${level.size}   bytes ${(total / 1024).toFixed(1)} KB   max depth ${depth}`);

  console.log('\nmodules per waterfall level (each level is one sequential round trip)');
  const perLevel = new Map;
  for (const [, value] of level) perLevel.set(value, (perLevel.get(value) ?? 0) + 1);
  for (const [value, count] of [...perLevel].sort((a, b) => a[0] - b[0])) {
    console.log(`  level ${value}  ${String(count).padStart(3)}  ${'#'.repeat(Math.min(count, 60))}`);
  }

  console.log('\nmost imported modules (preload candidates regardless of level)');
  const ranked = [...fanIn].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [file, count] of ranked) {
    console.log(`  ${String(count).padStart(3)}x  level ${level.get(file) ?? '?'}  ${relative(ROOT, file)}`);
  }

  if (external.size) {
    console.log(`\nexternal origins (${external.size}) — candidates for preconnect`);
    for (const url of [...external].sort()) console.log(`  ${url}`);
  }

  if (missing.size) {
    console.log(`\nMISSING (${missing.size}) — imported but not on disk`);
    for (const file of [...missing].sort()) console.log(`  ${relative(ROOT, file)}`);
  }

  if (unmapped.size) {
    console.log(`\nUNRESOLVED (${unmapped.size}) — no importmap entry, will 404 in the browser`);
    for (const line of [...unmapped].sort()) console.log(`  ${line}`);
  }

  console.log();
  return missing.size + unmapped.size;
}

// :::::: MAIN ::::::::::::::::::::::::::::::::::::::::::::::::::

const args    = process.argv.slice(2);
const mapFlag = args.indexOf('--map');
const mapFile = mapFlag === -1 ? 'importmap.js' : args[mapFlag + 1];

// skip the flag itself and its value; without the flag there is no value to skip
const skip    = mapFlag === -1 ? -1 : mapFlag + 1;
const target  = args.filter((arg, index) => !arg.startsWith('--') && index !== skip)[0] ?? ENTRY;

const entry   = resolve(HERE, '..', target);
const imports = loadImportmap(mapFile);

console.log(`using pulgasari.github.io/${mapFile}  (${Object.keys(imports).length} entries)`);

// a broken graph is a failed run, so this is usable as a check in ci
process.exit(report(entry, walk(entry, imports)) > 0 ? 1 : 0);
