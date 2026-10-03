import { AufbauElement } from '@aufbau/element';

// a placeholder and nothing else: lines, a block or a circle
// NOTE provisional name, no better one found yet and not happy with it
export default class AufbauSkeleton extends AufbauElement {
  static internals = { ariaHidden: 'true' };

  static reflect = ['shape'];

  static attr = {
    gap   : { type: String, var: '--skeleton-gap' },
    line  : { type: String, var: '--skeleton-line' },
    lines : { type: Number, default: 1, var: '--skeleton-lines' },
    shape : { type: String, default: 'text', values: ['text', 'rect', 'circle'] },
    size  : String,   // "width" or "width height"
  };

  static styles = `aufbau-skeleton {
    --skeleton-width : 100%;

    display: block;

    &[shape="rect"]   { --skeleton-line: 6em; --skeleton-lines: 1; }
    &[shape="circle"] { --skeleton-line: 2.5em; --skeleton-lines: 1; --skeleton-radius: 50%; --skeleton-width: 2.5em; display: inline-block; }
  }`;

  onConnected () { this.setSkeleton(true); }

  render () { return null; }

  sync () {
    const [width, height = width] = String(this.getAttr('size') ?? '').split(/\s+/).filter(Boolean);
    const block = this.getAttr('shape') !== 'text';
    this.setVar({ '--skeleton-width': width, '--skeleton-line': block ? height : this.getAttr('line') });
  }
}

AufbauSkeleton.init();
