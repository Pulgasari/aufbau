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
//
// give it item-size-min + item-size-max (px) and a two-finger resize is wired up
// (@aufbau/gestures adjustable, plus ctrl/⌘ + wheel on the desktop) so the viewer
// can scale the items live between those bounds:
//
//   <aufbau-index item-size-min="120px" item-size-max="320px"> … </aufbau-index>
//
// gestures follow the core `gestures` config (default 'auto') — set it to 'false'
// on the element, per tag, or globally (<aufbau-config gestures="false">) to opt
// out. the gesture code itself is only imported when a resize actually activates.

import { AufbauElement }           from './core/index.js';
import { parseLook, resolveShape } from './core/look.js';
// @aufbau/gestures is loaded lazily, only when an index actually resizes (below)

const setVar = (el, name, value) =>
  value ? el.style.setProperty(name, value) : el.style.removeProperty(name);

// a css length's leading number, e.g. "180px" -> 180; null when it isn't numeric
const parsePx = value => { const n = parseFloat(value); return Number.isFinite(n) ? n : null; };

export default class AufbauIndex extends AufbauElement {
  static attr = {
    viewmode    : { type: String, default: 'grid', values: ['grid', 'list', 'gallery', 'masonry'] },
    itemSize    : String,   // min item size, e.g. "180px" — grid/gallery/masonry
    itemSizeMin : String,   // with item-size-max, enables two-finger resize (px)
    itemSizeMax : String,   // upper bound for the resize (px)
    itemShape   : String,   // default shape for items without their own
    itemLook    : String,   // shorthand: "180px rounded"
    gap         : String,   // gap between items
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
    // an explicit size from the author takes over from a live resize
    else if (name === 'item-size' || name === 'item-look') this._resizeValue = null;
  }

  // (re)wire the two-finger resize when both bounds are present and gestures are
  // not switched off, tear it down otherwise. @aufbau/gestures is imported lazily
  // here, so an index that never resizes never pays for it. a token guards the
  // async gap against overlapping calls (rapid attribute changes) and unmount.
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
    setVar(this, '--aufbau-item-size', `${this._resizeValue}px`);

    this._resize = gestures.compose(this, {
      onAdjust : size => {
        this._resizeValue = Math.round(size);
        setVar(this, '--aufbau-item-size', `${this._resizeValue}px`);
      },
      value : this._resizeValue,
      min,
      max,
    });
  }

  sync () {
    const { itemSize, itemShape, itemLook, gap } = this.getAttr();
    const look = parseLook(itemLook);

    // a live resize wins; otherwise the explicit attribute, then the shorthand
    const size = this._resizeValue != null ? `${this._resizeValue}px` : (itemSize || look.size);

    setVar(this, '--aufbau-item-size',  size);
    setVar(this, '--aufbau-item-shape', resolveShape(itemShape || look.shape));
    setVar(this, '--aufbau-gap',        gap);
  }
}

AufbauIndex.init();
