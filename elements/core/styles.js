// @aufbau/elements/core/styles.js

import * as dom from '@domina/core';
import { isFn } from '@aufbau/js';

// every element base sheet lands here. an unlayered author rule always wins
// against a layered one, so page css keeps overriding component defaults
export const BASE_LAYER = 'aufbau.elements';

/**
 * collects the classes in the prototype chain that declare their OWN `static
 * styles`, base class first. inherited declarations are not re-adopted under
 * the subclass name, they keep the key of the class that declared them.
 */
function styleOwners (Cls) {
  const owners = [];
  for (let c = Cls; isFn(c); c = Object.getPrototypeOf(c)) {
    if (Object.hasOwn(c, 'styles') && c.styles) owners.unshift(c);
  }
  return owners;
}

const toCss = (styles, owner) => {
  const value = isFn(styles) ? styles.call(owner) : styles;
  return (Array.isArray(value) ? value : [value]).filter(Boolean).join('\n');
};

/**
 * adopts the `static styles` of a class and everything it inherited.
 * deduplicated per declaring class per root, so a hundred instances and a
 * dozen re-imports still adopt a single sheet.
 *
 * @param {Function} Cls
 * @param {Document|ShadowRoot|Element} [target]
 */
export function adoptClassStyles (Cls, target = document) {
  for (const owner of styleOwners(Cls)) {
    dom.adoptStylesheet(toCss(owner.styles, owner), {
      target,
      layer : owner.styleLayer,
      key   : `aufbau:styles:${owner.name}`,
    });
  }
}

/**
 * standalone variant for code that is not a component class.
 * @param {string} key - dedup key
 * @param {string} css
 */
export const adoptBaseStyles = (key, css) =>
  dom.adoptStylesheet(css, { key: `aufbau:styles:${key}`, layer: BASE_LAYER });
