// @aufbau/.github/scripts/generate-webfonts.mjs
// single source of truth is webfonts/handpicked.txt: one google fonts family name
// per line. this script resolves each family in the google/fonts repo, parses its
// METADATA.pb, rebuilds webfonts/data.js and (by default) downloads the font files
// into webfonts/files/. run it after editing handpicked.txt:
//   npm run generate:webfonts            # download files into the repo
//   npm run generate:webfonts -- --remote  # no download, link jsdelivr urls instead
//
// license values come straight from the repo folder (ofl/apache/ufl) and should
// still be spot-checked before publishing.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve }  from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT     = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WEBFONTS = resolve(ROOT, 'webfonts');
const LIST     = resolve(WEBFONTS, 'handpicked.txt');
const DATA     = resolve(WEBFONTS, 'data.js');
const FILES    = resolve(WEBFONTS, 'files');

const REPO       = 'google/fonts';
const REF        = 'main'; // pin to a commit sha for reproducible builds
const RAW        = (path) => `https://raw.githubusercontent.com/${REPO}/${REF}/${path}`;
const JSDELIVR   = (path) => `https://cdn.jsdelivr.net/gh/${REPO}@${REF}/${path}`;
const LICENSES   = ['ofl', 'apache', 'ufl']; // folders to probe, in order
const remote     = process.argv.includes('--remote');

// google category -> our category -> css generic fallback
const CATEGORY = {
  DISPLAY     : 'display',
  HANDWRITING : 'handwriting',
  MONOSPACE   : 'mono',
  SANS_SERIF  : 'sans',
  SERIF       : 'serif',
};

const FALLBACK = {
  display     : 'sans-serif',
  handwriting : 'cursive',
  mono        : 'monospace',
  sans        : 'sans-serif',
  serif       : 'serif',
};

// order sections appear in data.js; anything unlisted is appended alphabetically
const SECTIONS = ['sans', 'serif', 'mono', 'display', 'handwriting'];

const LICENSE_ID = { apache: 'Apache-2.0', ofl: 'OFL-1.1', ufl: 'UFL-1.0' };

// :::::: HELPERS :::::::::::::::::::::::::::::::::::::::::::::::::

const kebab   = (name) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const googleId = (name) => name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const toArray = (value) => value == null ? [] : (Array.isArray(value) ? value : [value]);
const intOf   = (value) => Math.round(Number(value));

// single-quoted js literal, or `null`
const q = (value) => value == null ? 'null' : `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

// :::::: METADATA.pb :::::::::::::::::::::::::::::::::::::::::::::

// minimal parser for the protobuf text format google ships. nested `key { … }`
// blocks become objects, repeated keys become arrays, scalars are coerced
function addField (obj, key, value) {
  if (key in obj) {
    if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
    obj[key].push(value);
  } else obj[key] = value;
}

function parsePb (text) {
  const root  = {};
  const stack = [root];

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const top = stack[stack.length - 1];

    if (line === '}') { stack.pop(); continue; }

    const block = line.match(/^([A-Za-z0-9_]+)\s*\{$/);
    if (block) {
      const child = {};
      addField(top, block[1], child);
      stack.push(child);
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!pair) continue;

    let value = pair[2].trim();
    if (value.startsWith('"'))            value = value.slice(1, value.lastIndexOf('"')).replace(/\\"/g, '"');
    else if (/^-?\d+(\.\d+)?$/.test(value)) value = Number(value);
    else if (value === 'true' || value === 'false') value = value === 'true';

    addField(top, pair[1], value);
  }

  return root;
}

// finds which license folder a family lives in and returns its parsed metadata
async function fetchMeta (name) {
  const id = googleId(name);

  for (const license of LICENSES) {
    const path     = `${license}/${id}/METADATA.pb`;
    const response = await fetch(RAW(path));
    if (!response.ok) continue;
    return { license, dir: `${license}/${id}`, meta: parsePb(await response.text()) };
  }

  return null;
}

// :::::: FACES ::::::::::::::::::::::::::::::::::::::::::::::::::::

// a clean, predictable filename per face: <id>[-italic]-variable.ext or <id>-<weight>[-italic].ext
function localName (id, face, variable) {
  const italic = face.style === 'italic' ? '-italic' : '';
  const ext    = extname(face.srcFile) || '.ttf';
  return variable ? `${id}${italic}-variable${ext}` : `${id}-${face.weight}${italic}${ext}`;
}

// derives the face list from metadata: one entry per shipped variable file (with the
// wght axis as the weight range), or one per static file otherwise
function toFaces (meta) {
  const fonts    = toArray(meta.fonts);
  const wght     = toArray(meta.axes).find(axis => axis.tag === 'wght');
  const variable = fonts.filter(font => String(font.filename).includes('['));

  if (variable.length && wght) {
    const range = `${intOf(wght.min_value)} ${intOf(wght.max_value)}`;
    return { variable: true, faces: variable.map(font => ({ weight: range, style: font.style || 'normal', srcFile: font.filename })) };
  }

  return { variable: false, faces: fonts.map(font => ({ weight: intOf(font.weight) || 400, style: font.style || 'normal', srcFile: font.filename })) };
}

// :::::: BUILD ::::::::::::::::::::::::::::::::::::::::::::::::::::

async function download (dir, srcFile, destPath) {
  const response = await fetch(RAW(`${dir}/${encodeURIComponent(srcFile)}`));
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, Buffer.from(await response.arrayBuffer()));
  return response.headers.get('content-length');
}

async function buildEntry (name, keepFeatures) {
  const found = await fetchMeta(name);
  if (!found) { console.warn(`  ✗ "${name}" not found under ${LICENSES.join('/')} — skipped`); return null; }

  const { license, dir, meta } = found;
  const id                     = kebab(meta.name || name);
  const category               = CATEGORY[meta.category] ?? 'sans';
  const { variable, faces }    = toFaces(meta);

  const resolved = [];
  for (const face of faces) {
    let file;
    if (remote) {
      file = JSDELIVR(`${dir}/${encodeURIComponent(face.srcFile)}`);
    } else {
      // Save directly into files/ without font-specific subfolders
      const rel  = `files/${localName(id, face, variable)}`;
      const size = await download(dir, face.srcFile, resolve(WEBFONTS, rel));
      console.log(`    ↓ ${rel}${size ? ` (${Math.round(size / 1024)} KB)` : ''}`);
      file = rel;
    }
    resolved.push({ weight: face.weight, style: face.style, file });
  }

  return {
    id,
    name       : meta.name || name.trim(),
    designer   : meta.designer || null,
    source     : toArray(meta.source)[0]?.repository_url || null,
    license    : LICENSE_ID[license] || license,
    commercial : true, // ofl/apache/ufl all permit commercial use — verify per font
    category,
    fallback   : FALLBACK[category] || 'sans-serif',
    features   : keepFeatures.get(id) ?? [],
    faces      : resolved,
  };
}

// :::::: SERIALIZE ::::::::::::::::::::::::::::::::::::::::::::::::

const section = (label) => `// ::: ${label} ${':'.repeat(Math.max(4, 50 - label.length))}`;

function serializeFace (face) {
  return `    { weight: ${typeof face.weight === 'number' ? face.weight : q(face.weight)}, style: ${q(face.style)}, file: ${q(face.file)} },`;
}

function serializeEntry (font) {
  const features = `[${font.features.map(q).join(', ')}]`;
  return [
    '{',
    `  id         : ${q(font.id)},`,
    `  name       : ${q(font.name)},`,
    `  designer   : ${q(font.designer)},`,
    `  source     : ${q(font.source)},`,
    `  license    : ${q(font.license)},`,
    `  commercial : ${font.commercial},`,
    `  category   : ${q(font.category)},`,
    `  fallback   : ${q(font.fallback)},`,
    `  features   : ${features},`,
    '  faces      : [',
    ...font.faces.map(serializeFace),
    '  ],',
    '},',
  ].join('\n');
}

function serialize (entries) {
  const order   = [...SECTIONS, ...[...new Set(entries.map(e => e.category))].filter(c => !SECTIONS.includes(c)).sort()];
  const grouped = order
    .map(category => ({ category, fonts: entries.filter(e => e.category === category).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter(group => group.fonts.length);

  const body = grouped
    .map(group => `${section(group.category)}\n\n${group.fonts.map(serializeEntry).join('\n\n')}`)
    .join('\n\n');

  return [
    '// @aufbau/webfonts/data.js',
    '// generated by .github/scripts/generate-webfonts.mjs — do not edit by hand.',
    '// edit handpicked.txt instead, then run `npm run generate:webfonts`.',
    '//',
    '// single source of truth for the collection, consumed by the preview page, the',
    '// per-font css generator and the js api. license values come from the google/fonts',
    '// folder and should be spot-checked before publishing.',
    '',
    'const fonts = [',
    '',
    body,
    '',
    ']; // end: fonts',
    '',
    'export         { fonts };',
    'export default { fonts };',
    '',
  ].join('\n');
}

// :::::: RUN :::::::::::::::::::::::::::::::::::::::::::::::::::::

// keep hand-curated `features` across regenerations by reading the current data.js
async function currentFeatures () {
  const map = new Map;
  try {
    const { fonts } = await import(pathToFileURL(DATA).href + `?t=${Date.now()}`);
    for (const font of fonts) if (font.features?.length) map.set(font.id, font.features);
  } catch { /* no readable data.js yet */ }
  return map;
}

async function main () {
  const raw   = await readFile(LIST, 'utf8');
  const names = raw.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

  if (!names.length) { console.error('handpicked.txt has no font names.'); process.exit(1); }

  console.log(`generating webfonts for ${names.length} families (${remote ? 'remote jsdelivr' : 'download into repo'})`);

  const keepFeatures = await currentFeatures();
  const entries      = [];

  for (const name of names) {
    console.log(`• ${name}`);
    const entry = await buildEntry(name, keepFeatures);
    if (entry) entries.push(entry);
  }

  if (!entries.length) { console.error('no fonts resolved, data.js left unchanged.'); process.exit(1); }

  await writeFile(DATA, serialize(entries));
  console.log(`\nwrote data.js with ${entries.length} fonts${remote ? '' : ` + files under ${FILES.replace(ROOT + '/', '')}/`}`);
}

main().catch(error => { console.error(error); process.exit(1); });
