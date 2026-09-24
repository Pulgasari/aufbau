// <aufbau-index>
// layout container for a run of items: grid, list, gallery rail or masonry.
// pure layout, it renders nothing and the children stay as authored. no shadow
// root on purpose: the children ARE the content, page css styles them directly.
//
// render skipping: <aufbau-item> uses content-visibility: auto, so off screen
// items are neither laid out nor painted. a skipped item needs a stand-in block
// size, see ESTIMATE below and the notes at the end of the file.

import { AufbauElement }           from './core/index.js';
import { parseLook, resolveShape } from './core/look.js';

const parsePx = value => { const number = parseFloat(value); return Number.isFinite(number) ? number : null; };

// attributes that change the item geometry. the learned estimate and the sizes
// the browser remembered per item belong to the old layout once one of them changes
const RELAYOUT = new Set(['item-look', 'item-shape', 'item-size', 'viewmode']);

export default class AufbauIndex extends AufbauElement {
  static reflect = ['viewmode'];

  static attr = {
    gap               : { type: String, var: true },   // -> --aufbau-gap
    itemIntrinsicSize : String,   // stand-in block size for never rendered items. unset = learned from the rendered ones
    itemLook          : String,   // shorthand: "180px rounded"
    itemShape         : String,   // default shape for items without their own
    itemSize          : String,   // min item size, e.g. "180px" — grid/gallery/masonry
    itemSizeMax       : String,   // upper bound for the resize (px)
    itemSizeMin       : String,   // with item-size-max, enables two-finger resize (px)
    viewmode          : { type: String, default: 'grid', values: ['grid', 'list', 'gallery', 'masonry'] },
  };

  static styles = `aufbau-index {
    /* grid is the default, so a bare <aufbau-index> already lays out */
    display               : grid;
    gap                   : var(--aufbau-gap, 1rem);
    grid-template-columns : repeat(auto-fill, minmax(var(--aufbau-item-size, 200px), 1fr));
    inline-size           : 100%;

    &[viewmode="list"] {
      display        : flex;
      flex-direction : column;
    }

    &[viewmode="gallery"] {
      display           : flex;
      overflow-x        : auto;
      padding-block-end : 0.5rem;
      scroll-snap-type  : x mandatory;

      > * {
        flex              : 0 0 var(--aufbau-item-size, 200px);
        scroll-snap-align : start;
      }
    }

    &[viewmode="masonry"] {
      column-gap   : var(--aufbau-gap, 1rem);
      column-width : var(--aufbau-item-size, 200px);
      display      : block;

      > * {
        break-inside     : avoid;
        margin-block-end : var(--aufbau-gap, 1rem);
      }
    }

    /* an index level default shape reaches its item children */
    &:is([item-shape="circle"], [item-shape="square"], [item-look~="circle"], [item-look~="square"]) > aufbau-item {
      aspect-ratio: 1 / 1;
    }

    /* render skipping off for every item, e.g. when items draw outside their box */
    &[eager] aufbau-item { content-visibility: visible; }

    /* one frame without auto: the browser drops the sizes it remembered for the old layout */
    &:state(relayout) aufbau-item { contain-intrinsic-block-size: var(--aufbau-item-intrinsic-size, var(--aufbau-item-size, 200px)); }
  }`;

  constructor () {
    super();
    this._samples = { count: 0, total: 0 };
  }

  render () { return null; }

  onMount () {
    this.syncResize();

    // capture: the event does not bubble, capturing still sees it on the way down
    this.on('contentvisibilityautostatechange', (event) => {
      if (!event.skipped) this.sample(event.target);
    }, { capture: true });
  }

  onUnmount () { this._resize?.destroy(); this._resize = null; }

  onAttributeChange (name) {
    if (name === 'item-size-min' || name === 'item-size-max') this.syncResize();
    if (name === 'item-size'     || name === 'item-look')     this._resizeValue = null;
    if (RELAYOUT.has(name)) this.relayout();
  }

  // :::::: ESTIMATE ::::::::::::::::::::::::::::::::::::::::::::

  get learns () { return !this.getAttr('itemIntrinsicSize'); }

  // every item that turns visible adds its real block size to a running mean.
  // measured in the next frame, so a burst of items costs one layout read
  sample (item) {
    if (!this.learns || item.localName !== 'aufbau-item' || item.hasAttribute('intrinsic-size')) return;
    if (item.parentElement?.closest('aufbau-index') !== this) return;   // items of a nested index are its own business

    (this._pending ??= new Set).add(item);
    if (this._frame) return;

    this._frame = requestAnimationFrame(() => {
      this._frame = null;
      for (const pending of this._pending) {
        const height = pending.getBoundingClientRect().height;
        if (height > 0) { this._samples.count += 1; this._samples.total += height; }
      }
      this._pending.clear();
      this.applyEstimate();
    });
  }

  applyEstimate () {
    const { count, total } = this._samples;
    if (!count) return;

    const estimate = Math.round(total / count);
    if (Math.abs(estimate - (this._estimate ?? 0)) < 1) return;

    this._estimate = estimate;
    this.setVar('item-intrinsic-size', `${estimate}px`);
  }

  relayout () {
    this._samples  = { count: 0, total: 0 };
    this._estimate = null;
    if (this.learns) this.setVar('item-intrinsic-size', null);

    // two frames: the style change has to reach resize observer timing once
    this.states.add('relayout');
    requestAnimationFrame(() => requestAnimationFrame(() => this.states.delete('relayout')));
  }

  // :::::: RESIZE ::::::::::::::::::::::::::::::::::::::::::::::

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

  // :::::: SYNC ::::::::::::::::::::::::::::::::::::::::::::::::

  sync () {
    const { itemIntrinsicSize, itemLook, itemShape, itemSize } = this.getAttr();   // gap is handled via `var`
    const look = parseLook(itemLook);
    const size = this._resizeValue != null ? `${this._resizeValue}px` : (itemSize || look.size);

    this.setVars({
      'item-shape' : resolveShape(itemShape || look.shape),
      'item-size'  : size,
    });

    // a manual value replaces the learned one, clearing it hands back to learning
    if (itemIntrinsicSize) this.setVar('item-intrinsic-size', itemIntrinsicSize);
    else if (this._estimate == null) this.setVar('item-intrinsic-size', null);
  }
}

AufbauIndex.init();

/*

-- render skipping and intrinsic size
content-visibility: auto skips layout and paint of off screen items. a skipped
item is size contained, so it needs a stand-in block size, otherwise it
collapses to 0 and the scrollbar jumps whenever items come into view.

contain-intrinsic-block-size: auto <estimate>
  `auto` makes the browser remember the real size of every item it has rendered
  once and use that while the item is skipped. the estimate therefore only
  stands in for items that were NEVER rendered. that is what makes variable
  heights (list rows, masonry) workable without measuring every item.

where the estimate comes from, first match wins:
  1. `intrinsic-size` on the item                one item, set on itself
  2. `item-intrinsic-size` on the index          every item, manual
  3. learned                                     mean block size of the items rendered so far
  4. --aufbau-item-size                          grid tiles are roughly that tall before anything is known

square items (shape circle/square) need none of it: aspect-ratio derives the
block size from the inline size the grid track already gives them.

-- relayout
a viewmode, size or shape change invalidates both the learned mean and the
sizes the browser remembered per item. the remembered ones are dropped by
removing `auto` for one frame (the :state(relayout) rule), the spec clears a
remembered size as soon as an element is seen without `auto` at resize
observer timing.

*/
