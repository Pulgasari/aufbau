// @aufbau/bundler/steps/webfonts.js
// only the fonts a project uses stay in its copy of an @aufbau/webfonts catalog,
// the files of all others are dropped and the catalog lists the kept ones only,
// so a font picker offers nothing that is not there:
//
//   webfonts: {
//     catalog : '_pkg/aufbau/webfonts/data.js',   // in the output
//     keep    : ['manrope'],                       // ids or names
//     scan    : true,                              // plus every font whose name the staged css and js quote
//   }
//
// the catalog module is left as generated, a line at its end filters the
// exported array in place.

import { existsSync } from 'node:fs';
import { appendFile, readFile, rm, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { walk } from './../shared.js';

const SCANNED = new Set(['.css', '.html', '.js', '.mjs']);

async function webfonts ({ config, log, out, report }) {
  if (!config.webfonts) return;
  const { catalog = '_pkg/aufbau/webfonts/data.js', keep = [], scan = true } = config.webfonts;

  const file = join(out, catalog);
  if (!existsSync(file)) return log(`webfonts: no catalog at ${catalog}`);
  const { fonts } = await import(pathToFileURL(file));

  // :::::: KEEP

  const kept = new Set(fonts.filter(font => keep.includes(font.id) || keep.includes(font.name)).map(font => font.id));

  // a font name in quotes: font stacks, defaults, `font: 'Manrope'`. the catalog
  // itself quotes them all and is left out
  if (scan) {
    const texts = [];
    for (const path of await walk(out)) if (SCANNED.has(extname(path)) && resolve(path) !== resolve(file)) texts.push(await readFile(path, 'utf8'));
    const code = texts.join('\n');
    for (const font of fonts) if ([`'${font.name}'`, `"${font.name}"`].some(quoted => code.includes(quoted))) kept.add(font.id);
  }

  // :::::: DROP

  const root    = dirname(file);
  const needed  = new Set(fonts.filter(font => kept.has(font.id)).flatMap(font => font.faces.map(face => face.file)));
  let   dropped = 0;
  for (const font of fonts) {
    if (kept.has(font.id)) continue;
    for (const face of font.faces) {
      const path = join(root, face.file);
      if (/^https?:\/\//.test(face.file) || needed.has(face.file) || !existsSync(path)) continue;
      dropped += (await stat(path)).size;
      await rm(path);
    }
  }

  await appendFile(file, `\n// @aufbau/bundler: only the fonts this build ships\nfonts.splice(0, fonts.length, ...fonts.filter(font => ${JSON.stringify([...kept].sort())}.includes(font.id)));\n`);

  log(`webfonts ${kept.size} of ${fonts.length} kept`);
  report('webfonts', [
    `kept: ${[...kept].sort().join(', ') || 'none'}`,
    `dropped: ${fonts.length - kept.size} fonts, ${(dropped / 1024 / 1024).toFixed(1)} mb`,
  ]);
}

export { webfonts };
export default webfonts;
