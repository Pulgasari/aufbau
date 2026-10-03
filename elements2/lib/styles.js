import adoptStylesheet from '@domina/methods/adoptStylesheet.js';
import { isFn }        from '@pulgasari/is';

export const BASE_LAYER = 'aufbau.elements';
export const SKIN_LAYER = 'aufbau.skin';

let ordered = false;

export function ensureLayerOrder (target = document) {
  if (ordered || typeof CSSStyleSheet === 'undefined' || !('adoptedStyleSheets' in Document.prototype)) return;
  ordered = true;

  const root  = target.adoptedStyleSheets ? target : document;
  const sheet = new CSSStyleSheet;
  sheet.replaceSync(`@layer ${BASE_LAYER}, ${SKIN_LAYER};`);
  root.adoptedStyleSheets = [sheet, ...root.adoptedStyleSheets];
}

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

export function adoptClassStyles (Cls, target = document) {
  ensureLayerOrder(target);

  for (const owner of styleOwners(Cls)) {
    adoptStylesheet(toCss(owner.styles, owner), {
      target,
      layer : owner.styleLayer ?? BASE_LAYER,
      key   : `aufbau:styles:${owner.name}`,
    });
  }
}

export const adoptBaseStyles = (key, css) =>
  adoptStylesheet(css, { key: `aufbau:styles:${key}`, layer: BASE_LAYER });

