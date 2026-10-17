// @aufbau/elements :: lib/import

/*
the part of file loading the elements need, so they depend on nothing outside:
data for data-list, data-table, data-tree and the option lists, markdown for
output-md (and builders/docs).

  importFile(src)    json, jsonc, csv / tsv (records), yaml / yml, md (html), anything else as text
  renderMD(text)     markdown to html

parsers load from esm.sh on first use (or from the page's import map under
their bare name): papaparse, yaml, marked. one fetch per url and page; a value
is shared, so a caller that changes data in place works on a copy.
the full loader with every format and a persistent cache is @rat/import.
*/

const CDN = 'https://esm.sh/';

const VENDORS = {
  marked    : 'marked@11.1.1',
  papaparse : 'papaparse@5.4.1',
  yaml      : 'yaml@2.3.4',
};

const vendors = new Map;
const files   = new Map;

// the import map's copy when there is one, else the pinned version on the cdn
function vendor (name) {
  if (!vendors.has(name)) {
    let specifier = CDN + VENDORS[name];
    try { specifier = import.meta.resolve?.(name) ?? specifier; } catch {}
    const loading = import(/* @vite-ignore */ specifier).catch(() => import(/* @vite-ignore */ CDN + VENDORS[name]));
    loading.catch(() => vendors.delete(name));
    vendors.set(name, loading);
  }
  return vendors.get(name);
}

const JSONC = /"(?:[^"\\]|\\.)*"|\/\/[^\n]*|\/\*[\s\S]*?\*\/|,(?=\s*[}\]])/g;

const extensionOf = src => /\.([a-z0-9]+)$/i.exec(new URL(src, document.baseURI).pathname)?.[1].toLowerCase() ?? '';

async function renderMD (text) {
  return (await vendor('marked')).marked.parse(text);
}

const PARSERS = {
  csv   : async (text, src) => (await vendor('papaparse')).default.parse(text, { delimiter: extensionOf(src) === 'tsv' ? '\t' : undefined, dynamicTyping: true, header: true, skipEmptyLines: true }).data,
  json  : text => JSON.parse(text),
  jsonc : text => JSON.parse(text.replace(JSONC, match => match[0] === '"' ? match : '')),
  md    : text => renderMD(text),
  yaml  : async text => (await vendor('yaml')).default.parse(text),
};

const ALIASES = { tsv: 'csv', yml: 'yaml' };

async function load (src) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`[@aufbau/elements] ${src}: ${response.status} ${response.statusText}`);
  const text  = await response.text();
  const ext   = extensionOf(src);
  const parse = PARSERS[ALIASES[ext] ?? ext];
  return parse ? parse(text, src) : text;
}

function importFile (src) {
  const url = new URL(src, document.baseURI).href;
  if (!files.has(url)) {
    const loading = load(url);
    loading.catch(() => files.delete(url));
    files.set(url, loading);
  }
  return files.get(url);
}

// :::::: EXPORT

export { importFile, renderMD };
export default importFile;
