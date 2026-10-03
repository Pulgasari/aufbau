import { AufbauElement }           from '@aufbau/element';
import { parseLook, resolveShape } from '../lib/itemLook.js';

export default class AufbauItem extends AufbauElement {
  static attr = {
    eager         : Boolean,
    intrinsicSize : String,
    look          : String,
    shape         : String,
  };

  static styles = `aufbau-item {
    border-radius : var(--item-current-shape, var(--item-shape, 0px));
    box-sizing    : border-box;
    display       : block;
    overflow      : hidden;

    content-visibility           : auto;
    contain-intrinsic-block-size : auto var(--item-intrinsic-size, var(--item-size, 200px));

    transition-behavior : allow-discrete;

    &:is([shape="circle"], [shape="square"], [look~="circle"], [look~="square"]) { aspect-ratio: 1 / 1; }

    &[eager] { content-visibility: visible; }
  }`;

  render () { return null; }

  sync () {
    const { intrinsicSize, look, shape } = this.getAttr();

    this.setVar({
      '--item-current-shape'  : resolveShape(shape || parseLook(look).shape),
      '--item-intrinsic-size' : intrinsicSize,
    });
  }
}

AufbauItem.init();
