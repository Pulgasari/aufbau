import adoptStylesheet from '@domina/methods/adoptStylesheet.js';
import { isFn }        from '@pulgasari/is';

export const BASE_LAYER = 'aufbau.elements';
export const SKIN_LAYER = 'aufbau.skin';

const SUPPORTED = typeof CSSStyleSheet !== 'undefined' && typeof Document !== 'undefined' && 'adoptedStyleSheets' in Document.prototype;

// a constructed sheet can only be adopted in the document it was made for:
// document -> { order, classes: class -> sheet }. every tree of that document shares them
const cache = new WeakMap;

function cacheOf (doc) {
  let entry = cache.get(doc);
  if (!entry) cache.set(doc, entry = { classes: new Map, order: null });
  return entry;
}

function createSheet (doc, css) {
  const Sheet = doc.defaultView?.CSSStyleSheet ?? CSSStyleSheet;
  const sheet = new Sheet;
  sheet.replaceSync(css);
  return sheet;
}

const documentOf = root => root.ownerDocument ?? root;

function styleOwners (Cls) {
  const owners = [];
  for (let c = Cls; isFn(c); c = Object.getPrototypeOf(c)) {
    if (Object.hasOwn(c, 'styles') && c.styles) owners.unshift(c);
  }
  return owners;
}

const toCss = (styles, owner) => {
  const value = isFn(styles) ? styles.call(owner) : styles;
  const list  = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).join('\n');
};

// the styles of one class, built once per document
function classSheet (owner, doc) {
  const { classes } = cacheOf(doc);
  let sheet = classes.get(owner);
  if (!sheet) classes.set(owner, sheet = createSheet(doc, `@layer ${owner.styleLayer ?? BASE_LAYER} {\n${toCss(owner.styles, owner)}\n}`));
  return sheet;
}

// the layer order goes first into every tree that gets element styles
export function ensureLayerOrder (root = document) {
  if (!SUPPORTED || !root?.adoptedStyleSheets) return;

  const entry = cacheOf(documentOf(root));
  entry.order ??= createSheet(documentOf(root), `@layer ${BASE_LAYER}, ${SKIN_LAYER};`);

  if (!root.adoptedStyleSheets.includes(entry.order)) root.adoptedStyleSheets = [entry.order, ...root.adoptedStyleSheets];
}

// root: the shadow root of the element, or the document or shadow root it sits in
export function adoptClassStyles (Cls, root = document) {
  if (!SUPPORTED || !root?.adoptedStyleSheets) return;

  ensureLayerOrder(root);

  const doc     = documentOf(root);
  const adopted = root.adoptedStyleSheets;
  const missing = styleOwners(Cls).map(owner => classSheet(owner, doc)).filter(sheet => !adopted.includes(sheet));

  if (missing.length) root.adoptedStyleSheets = [...adopted, ...missing];
}

export function adoptBaseStyles (key, css) {
  ensureLayerOrder(document);
  return adoptStylesheet(css, { key: `aufbau:styles:${key}`, layer: BASE_LAYER });
}
