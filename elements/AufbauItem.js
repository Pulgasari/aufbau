// <aufbau-item>
// a cell inside <aufbau-index>. a layout element, not a control: it never
// renders markup of its own, it only carries its authored content and reflects
// its `shape` (or the shape half of a `look` shorthand) onto a css variable the
// stylesheet reads. keeping render() null means its light-dom children — an
// <img>, a card, whatever — are never wiped.

import { AufbauElement }           from './core/index.js';
import { parseLook, resolveShape } from './core/look.js';

const setVar = (el, name, value) =>
  value ? el.style.setProperty(name, value) : el.style.removeProperty(name);

export default class AufbauItem extends AufbauElement {
  static attr = {
    shape : String,   // circle | square | rounded | squircle | any radius value
    look  : String,   // shorthand, only the shape half is read here
  };

  static styles = `
    aufbau-item {
      display       : block;
      box-sizing    : border-box;
      overflow      : hidden;
      /* an item's own shape wins; otherwise it inherits the index default */
      border-radius : var(--aufbau-current-shape, var(--aufbau-item-shape, 0px));
    }

    /* circle and square are meant to be equal-sided */
    aufbau-item[shape="circle"],
    aufbau-item[shape="square"] { aspect-ratio: 1 / 1; }
  `;

  render () { return null; }

  sync () {
    const { shape, look } = this.getAttr();
    const resolved = resolveShape(shape || parseLook(look).shape);
    setVar(this, '--aufbau-current-shape', resolved);
  }
}

AufbauItem.init();
