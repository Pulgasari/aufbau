// <aufbau-skeleton>
// a standalone placeholder, for content an app is still fetching. it is only
// the core skeleton, permanently on: the host paints the lines, nothing is rendered.
//
//   <aufbau-skeleton lines="3"></aufbau-skeleton>                text block
//   <aufbau-skeleton shape="circle" size="3rem"></aufbau-skeleton>   avatar, cover
//   <aufbau-skeleton shape="rect" size="100% 12rem"></aufbau-skeleton>  image, card
//
// any other aufbau element takes the `skeleton` attribute for the same look in
// its own place, e.g. <aufbau-item skeleton>. purely decorative, hidden from
// assistive tech; mark the region that is loading with aria-busy instead.

import { AufbauElement } from './core/index.js';

export default class AufbauSkeleton extends AufbauElement {
  static internals = { ariaHidden: 'true' };

  static reflect = ['shape'];

  static attr = {
    gap   : String,
    line  : String,
    lines : 1,
    shape : { type: String, default: 'text', values: ['text', 'rect', 'circle'] },
    size  : String,   // "width" or "width height"
  };

  static styles = `aufbau-skeleton {
    display: block;

    &[shape="circle"] { display: inline-block; }
  }`;

  // text: lines of the given height. rect and circle: one solid block of `size`
  static skeleton () {
    const { gap, line, lines, shape, size } = this.getAttr();
    const [width, height = width] = String(size ?? '').split(/\s+/).filter(Boolean);

    if (shape === 'text') return { gap, line, lines, width: width ?? '100%' };

    return {
      line   : height ?? (shape === 'circle' ? '2.5em' : '6em'),
      lines  : 1,
      radius : shape === 'circle' ? '50%' : undefined,
      width  : width ?? (shape === 'circle' ? '2.5em' : '100%'),
    };
  }

  onMount () { this.setSkeleton(true); }

  render () { return null; }
}

AufbauSkeleton.init();
