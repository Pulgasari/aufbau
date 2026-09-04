// <aufbau-index>

import { AufbauElement }           from './core/index.js';
import { parseLook, resolveShape } from './core/look.js';

const parsePx = value => { const n = parseFloat(value); return Number.isFinite(n) ? n : null; };

export default class AufbauIndex extends AufbauElement {
  static attr = {
    viewmode    : { type: String, default: 'grid', values: ['grid', 'list', 'gallery', 'masonry'] },
    itemSize    : String,   // min item size, e.g. "180px" — grid/gallery/masonry
    itemSizeMin : String,   // with item-size-max, enables two-finger resize (px)
    itemSizeMax : String,   // upper bound for the resize (px)
    itemShape   : String,   // default shape for items without their own
    itemLook    : String,   // shorthand: "180px rounded"
    gap         : { type: String, var: true },   // -> --aufbau-gap, handled automatically
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

  render    () { return null; }
  onMount   () { this.syncResize(); }
  onUnmount () { this._resize?.destroy(); this._resize = null; }

  onAttributeChange (name) {
         if (name === 'item-size-min' || name === 'item-size-max') this.syncResize();
    else if (name === 'item-size'     || name === 'item-look')     this._resizeValue = null;
  }
  
  async syncResize () {
    this._resize?.destroy();
    this._resize = null;

    const min    = parsePx(this.getAttr('itemSizeMin'));
    const max    = parsePx(this.getAttr('itemSizeMax'));
    const active = this.gesturesMode() !== 'false' && min != null && max != null && max > min;
    const token  = this._resizeToken = (this._resizeToken ?? 0) + 1;

    if (!active) { this._resizeValue = null; return; }

    const gestures = await import('@aufbau/gestures');
    if (token !== this._resizeToken || !this._mounted) return;   // superseded or unmounted

    const start = this._resizeValue ?? parsePx(this.getAttr('itemSize')) ?? (min + max) / 2;
    this._resizeValue = gestures.clamp(start, min, max);
    this.setVar('item-size', `${this._resizeValue}px`);

    this._resize = gestures.compose(this, {
      onAdjust : size => {
        this._resizeValue = Math.round(size);
        this.setVar('item-size', `${this._resizeValue}px`);
      },
      value : this._resizeValue,
      min,
      max,
    });
  }

  sync () {
    const { itemSize, itemShape, itemLook } = this.getAttr();   // gap is handled via `var`
    const look = parseLook(itemLook);
    const size = this._resizeValue != null ? `${this._resizeValue}px` : (itemSize || look.size);

    this.setVars({
      'item-size'  : size,
      'item-shape' : resolveShape(itemShape || look.shape),
    });
  }
}

AufbauIndex.init();
