// <aufbau-item>
// one entry of an <aufbau-index>, usable on its own as well. renders nothing,
// its content stays as authored, no shadow root, page css reaches all of it.
// skipped while off screen, see the notes in AufbauIndex.js for how its
// stand-in size is chosen.

import { AufbauElement }           from './core/index.js';
import { parseLook, resolveShape } from './core/look.js';

export default class AufbauItem extends AufbauElement {
  static attr = {
    eager         : Boolean,   // opt out of render skipping, e.g. for content drawn outside the box
    intrinsicSize : String,    // stand-in block size while skipped, overrides the index estimate
    look          : String,    // shorthand, only the shape half is read here
    shape         : String,    // circle | square | rounded | squircle | any radius value
  };

  static styles = `aufbau-item {
    border-radius : var(--aufbau-current-shape, var(--aufbau-item-shape, 0px));
    box-sizing    : border-box;
    display       : block;
    overflow      : hidden;

    /* skip layout and paint while off screen. auto keeps the real size once rendered */
    content-visibility           : auto;
    contain-intrinsic-block-size : auto var(--aufbau-item-intrinsic-size, var(--aufbau-item-size, 200px));

    /* lets display and content-visibility take part in transitions, so a filtered
       item can fade out with @starting-style instead of vanishing. on its own it
       changes nothing, a transition-property has to name the discrete property */
    transition-behavior : allow-discrete;

    &:is([shape="circle"], [shape="square"], [look~="circle"], [look~="square"]) { aspect-ratio: 1 / 1; }

    &[eager] { content-visibility: visible; }
  }`;

  render () { return null; }

  sync () {
    const { intrinsicSize, look, shape } = this.getAttr();

    this.setVars({
      'current-shape'       : resolveShape(shape || parseLook(look).shape),
      'item-intrinsic-size' : intrinsicSize,
    });
  }
}

AufbauItem.init();
