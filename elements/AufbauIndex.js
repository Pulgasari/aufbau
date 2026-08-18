// <aufbau-index>
// a layout container for a set of items — a media grid, a gallery rail, a plain
// list. it is pure layout: it never renders markup, so its children (usually
// <aufbau-item>, but any element works) stay exactly as authored. the viewmode
// is driven entirely by css attribute selectors; the js only reflects the size,
// gap and shape knobs onto css variables the stylesheet reads.
//
//   <aufbau-index viewmode="grid" item-look="180px rounded" gap="1.5rem">
//     <aufbau-item>…</aufbau-item>
//     <aufbau-item shape="circle">…</aufbau-item>
//   </aufbau-index>

import { AufbauElement }           from './core/index.js';
import { parseLook, resolveShape } from './core/look.js';

const setVar = (el, name, value) =>
  value ? el.style.setProperty(name, value) : el.style.removeProperty(name);

export default class AufbauIndex extends AufbauElement {
  static attr = {
    viewmode  : { type: String, default: 'grid', values: ['grid', 'list', 'gallery', 'masonry'] },
    itemSize  : String,   // min item size, e.g. "180px" — grid/gallery/masonry
    itemShape : String,   // default shape for items without their own
    itemLook  : String,   // shorthand: "180px rounded"
    gap       : String,   // gap between items
  };

  static styles = `
    /* grid is the default, so a bare <aufbau-index> already lays out */
    aufbau-index {
      display   : grid;
      gap       : var(--aufbau-gap, 1rem);
      inline-size: 100%;
      grid-template-columns: repeat(auto-fill, minmax(var(--aufbau-item-size, 200px), 1fr));
    }

    aufbau-index[viewmode="list"] {
      display        : flex;
      flex-direction : column;
      grid-template-columns: none;
    }

    aufbau-index[viewmode="gallery"] {
      display          : flex;
      grid-template-columns: none;
      overflow-x       : auto;
      scroll-snap-type : x mandatory;
      padding-block-end: 0.5rem;
    }
    aufbau-index[viewmode="gallery"] > * {
      flex             : 0 0 var(--aufbau-item-size, 200px);
      scroll-snap-align: start;
    }

    aufbau-index[viewmode="masonry"] {
      display     : block;
      grid-template-columns: none;
      column-width: var(--aufbau-item-size, 200px);
      column-gap  : var(--aufbau-gap, 1rem);
    }
    aufbau-index[viewmode="masonry"] > * {
      break-inside     : avoid;
      margin-block-end : var(--aufbau-gap, 1rem);
    }

    /* an index-level default shape reaches its item children */
    aufbau-index[item-shape="circle"] > aufbau-item,
    aufbau-index[item-shape="square"] > aufbau-item { aspect-ratio: 1 / 1; }
  `;

  render () { return null; }

  sync () {
    const { itemSize, itemShape, itemLook, gap } = this.getAttr();
    const look = parseLook(itemLook);

    // explicit attributes override the shorthand
    setVar(this, '--aufbau-item-size',  itemSize || look.size);
    setVar(this, '--aufbau-item-shape', resolveShape(itemShape || look.shape));
    setVar(this, '--aufbau-gap',        gap);
  }
}

AufbauIndex.init();
