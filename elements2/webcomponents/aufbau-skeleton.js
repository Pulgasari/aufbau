import { AufbauElement } from '../base/AufbauElement.js';

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

  onConnected () { this.setSkeleton(true); }

  render () { return null; }
}

AufbauSkeleton.init();
