import { AufbauElement }           from '@aufbau/element';
import { parseLook, resolveShape } from '../lib/itemLook.js';

const parsePx = value => { const number = parseFloat(value); return Number.isFinite(number) ? number : null; };

const RELAYOUT = new Set(['item-look', 'item-shape', 'item-size', 'viewmode']);

export default class DataIndex extends AufbauElement {
  static reflect = ['viewmode'];

  static attr = {
    gap               : { type: String, var: '--index-gap' },
    itemIntrinsicSize : String,
    itemLook          : String,   // shorthand: "180px rounded"
    itemShape         : String,   // default shape for items without their own
    itemSize          : String,
    itemSizeMax       : String,   // upper bound for the resize (px)
    itemSizeMin       : String,
    viewmode          : { type: String, default: 'grid', values: ['grid', 'list', 'gallery', 'masonry'] },
  };

  static styles = `data-index {
    display               : grid;
    gap                   : var(--index-gap, 1rem);
    grid-template-columns : repeat(auto-fill, minmax(var(--item-size, 200px), 1fr));
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
        flex              : 0 0 var(--item-size, 200px);
        scroll-snap-align : start;
      }
    }

    &[viewmode="masonry"] {
      column-gap   : var(--index-gap, 1rem);
      column-width : var(--item-size, 200px);
      display      : block;

      > * {
        break-inside     : avoid;
        margin-block-end : var(--index-gap, 1rem);
      }
    }

    &:is([item-shape="circle"], [item-shape="square"], [item-look~="circle"], [item-look~="square"]) > data-item {
      aspect-ratio: 1 / 1;
    }

    &[eager] data-item { content-visibility: visible; }

    &:state(relayout) data-item { contain-intrinsic-block-size: var(--item-intrinsic-size, var(--item-size, 200px)); }
  }`;

  constructor () {
    super();
    this._samples = { count: 0, total: 0 };
  }

  render () { return null; }

  onConnected () {
    this.syncResize();

    this.on('contentvisibilityautostatechange', (event) => {
      if (!event.skipped) this.sample(event.target);
    }, { capture: true });
  }

  onDisconnected () { this._resize?.destroy(); this._resize = null; }

  onAttributeChanged (name) {
    if (name === 'item-size-min' || name === 'item-size-max') this.syncResize();
    if (name === 'item-size'     || name === 'item-look')     this._resizeValue = null;
    if (RELAYOUT.has(name)) this.relayout();
  }

  // :::::: ESTIMATE ::::::::::::::::::::::::::::::::::::::::::::

  get learns () { return !this.getAttr('itemIntrinsicSize'); }

  sample (item) {
    if (!this.learns || item.localName !== 'data-item' || item.hasAttribute('intrinsic-size')) return;
    if (item.parentElement?.closest('data-index') !== this) return;

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
    this.setVar('--item-intrinsic-size', `${estimate}px`);
  }

  relayout () {
    this._samples  = { count: 0, total: 0 };
    this._estimate = null;
    if (this.learns) this.setVar('--item-intrinsic-size', null);

    this.states.add('relayout');
    requestAnimationFrame(() => requestAnimationFrame(() => this.states.delete('relayout')));
  }

  // :::::: RESIZE ::::::::::::::::::::::::::::::::::::::::::::::

  async syncResize () {
    this._resize?.destroy();
    this._resize = null;

    const min    = parsePx(this.getAttr('itemSizeMin'));
    const max    = parsePx(this.getAttr('itemSizeMax'));
    const active = this.getAttr('gestures') !== 'false' && min != null && max != null && max > min;
    const token  = this._resizeToken = (this._resizeToken ?? 0) + 1;

    if (!active) { this._resizeValue = null; return; }

    const { adjustable } = await import('@aufbau/gestures');
    if (token !== this._resizeToken || !this._mounted) return;   // superseded or unmounted

    const start = this._resizeValue ?? parsePx(this.getAttr('itemSize')) ?? (min + max) / 2;

    this._resize = adjustable(this, {
      maximum  : max,
      minimum  : min,
      onChange : size => {
        this._resizeValue = Math.round(size);
        this.setVar('--item-size', `${this._resizeValue}px`);
      },
      value : start,
    });

    this._resizeValue = this._resize.get();
    this.setVar('--item-size', `${this._resizeValue}px`);
  }

  // :::::: SYNC ::::::::::::::::::::::::::::::::::::::::::::::::

  sync () {
    const { itemIntrinsicSize, itemLook, itemShape, itemSize } = this.getAttr();   // gap is handled via `var`
    const look = parseLook(itemLook);
    const size = this._resizeValue != null ? `${this._resizeValue}px` : (itemSize || look.size);

    this.setVar({
      '--item-shape' : resolveShape(itemShape || look.shape),
      '--item-size'  : size,
    });

    if (itemIntrinsicSize) this.setVar('--item-intrinsic-size', itemIntrinsicSize);
    else if (this._estimate == null) this.setVar('--item-intrinsic-size', null);
  }
}

DataIndex.init();

