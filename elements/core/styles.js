// @aufbau/elements/core/styles.js

import { isFn }      from '@aufbau/js';
import * as dom      from '@domina/core';
import { arrayfied } from './utils.js';

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
  return arrayfied(value).filter(Boolean).join('\n');
};

export function adoptClassStyles (Cls, target = document) {
  ensureLayerOrder(target);

  for (const owner of styleOwners(Cls)) {
    dom.adoptStylesheet(toCss(owner.styles, owner), {
      target,
      layer : owner.styleLayer ?? BASE_LAYER,
      key   : `aufbau:styles:${owner.name}`,
    });
  }
}

export const adoptBaseStyles = (key, css) =>
  dom.adoptStylesheet(css, { key: `aufbau:styles:${key}`, layer: BASE_LAYER });

/*

-- BASE_LAYER
every element base sheet lands here. an unlayered author rule always wins
against a layered one, so page css keeps overriding component defaults

-- SKIN_LAYER
the swappable look, see ./skin.js. deliberately a SIBLING of BASE_LAYER, not a
sub layer: a parent layer's own rules beat those of its sub layers, so
aufbau.elements.skin would lose against the very structure it has to decorate

-- ordered
pins the layer order once, up front. without this statement the order falls
out of whichever sheet happens to be adopted first, and adoption is async.
prepended so it is the first sheet the cascade sees.

-- styleOwners
collects the classes in the prototype chain that declare their OWN `static styles`, base class first.
inherited declarations are not re-adopted under the subclass name, they keep the key of the class that declared them.     

-- adoptBaseStyles
standalone variant for code that is not a component class.
@param {string} key - dedup key
@param {string} css

-- adoptClassStyles
adopts the `static styles` of a class and everything it inherited.
deduplicated per declaring class per root, so a hundred instances
and a dozen re-imports still adopt a single sheet.
@param {Function} Cls
@param {Document|ShadowRoot|Element} [target]

*/
