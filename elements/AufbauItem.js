// <aufbau-item>

import { AufbauElement }           from './core/index.js';
import { parseLook, resolveShape } from './core/look.js';

const setVar = (el, name, value) =>
  value ? el.style.setProperty(name, value) : el.style.removeProperty(name);

export default class AufbauItem extends AufbauElement {
  static attr = {
    look  : String, // shorthand, only the shape half is read here
    shape : String, // circle | square | rounded | squircle | any radius value
  };

  static styles = `
    aufbau-item {
      border-radius : var(--aufbau-current-shape, var(--aufbau-item-shape, 0px));     
      display       : block;
      box-sizing    : border-box;
      overflow      : hidden;
      
    /*contain-intrinsic-height : auto 170px;*/
      content-visibility       : auto;
      transition-behavior      : allow-discrete;

      &[shape="circle"],
      &[shape="square"] { aspect-ratio: 1 / 1; }
    }
  `;

  render () { return null; }

  sync () {
    const { shape, look } = this.getAttr();
    const parsed   = shape || parseLook(look).shape;
    const resolved = resolveShape();
    setVar(this, '--aufbau-current-shape', resolved);
  }
}

AufbauItem.init();
