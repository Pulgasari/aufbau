// @aufbau/bundler/steps/webfonts.js

/*
only the fonts a project uses stay in its copy of an @aufbau/webfonts catalog,
the files of all others are dropped and the catalog lists the kept ones only,
so a font picker offers nothing that is not there:

webfonts: {
  catalog : '_pkg/aufbau/webfonts/data.js', // in the output
  keep    : ['manrope'],                    // ids or names
  scan    : true,                           // plus every font whose name the staged css and js quote
}

the catalog module is left as generated, a line at its end filters the exported array in place.
*/

import {
  appendText, directoryOf, extensionOf, importFile, joinPath, listFiles, megabytes, pathExists,
  readText, removePath, resolvePath, sizeOf,
} from './../shared.js';

const SCANNED = new Set(['.css', '.html', '.js', '.mjs']);

async function webfonts ({ config, log, out, report }) {
  if (!config.webfonts) return;
  const { catalog = '_pkg/aufbau/webfonts/data.js', keep = [], scan = true } = config.webfonts;

  const file = joinPath(out, catalog);
  if (!pathExists(file)) return log(`webfonts: no catalog at ${catalog}`);
  const { fonts } = await importFile(file);

  // :::::: KEEP

  const kept = new Set(fonts.filter(font => keep.includes(font.id) || keep.includes(font.name)).map(font => font.id));

  // a font name in quotes: font stacks, defaults, `font: 'Manrope'`. the catalog
  // itself quotes them all and is left out
  if (scan) {
    const texts = [];
    for (const path of await listFiles(out)) if (SCANNED.has(extensionOf(path)) && resolvePath(path) !== resolvePath(file)) texts.push(await readText(path));
    const code = texts.join('\n');
    for (const font of fonts) if ([`'${font.name}'`, `"${font.name}"`].some(quoted => code.includes(quoted))) kept.add(font.id);
  }

  // :::::: DROP

  const root    = directoryOf(file);
  const needed  = new Set(fonts.filter(font => kept.has(font.id)).flatMap(font => font.faces.map(face => face.file)));
  let   dropped = 0;
  for (const font of fonts) {
    if (kept.has(font.id)) continue;
    for (const face of font.faces) {
      const path = joinPath(root, face.file);
      if (/^https?:\/\//.test(face.file) || needed.has(face.file) || !pathExists(path)) continue;
      dropped += await sizeOf(path);
      await removePath(path);
    }
  }

  await appendText(file, `\n// @aufbau/bundler: only the fonts this build ships\nfonts.splice(0, fonts.length, ...fonts.filter(font => ${JSON.stringify([...kept].sort())}.includes(font.id)));\n`);

  log(`webfonts ${kept.size} of ${fonts.length} kept`);
  report('webfonts', [
    `kept: ${[...kept].sort().join(', ') || 'none'}`,
    `dropped: ${fonts.length - kept.size} fonts, ${megabytes(dropped)} mb`,
  ]);
}

export { webfonts };
export default webfonts;
