import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// one symbol of a sprite sheet: <svg><use href="sprite.svg#name"></svg>. the
// sheet has to be same origin, or inline in the page (no src). fill follows
// currentColor where the symbol leaves it open
export default class SvgSprite extends AufbauElement {
  static attr = {
    icon    : String,
    label   : String,
    size    : String,
    src     : String,
    viewbox : String,
  };

  static styles = `svg-sprite {
    block-size     : var(--sprite-size, 1em);
    display        : inline-block;
    fill           : currentColor;
    flex           : none;
    inline-size    : var(--sprite-size, 1em);
    line-height    : 0;
    vertical-align : var(--sprite-align, -0.125em);

    > svg { block-size: 100%; inline-size: 100%; }

    &:not([icon]) { display: none; }
  }`;

  render () {
    const { icon, src, viewbox } = this.getAttr();
    if (!icon) return '';
    return html`<svg aria-hidden="true" ${attrs({ viewBox: viewbox })}><use href="${src ?? ''}#${icon}"></use></svg>`;
  }

  sync () {
    const { label, size } = this.getAttr();
    this.setVar({ '--sprite-size': size });

    if (this.internals) {
      this.internals.role       = label ? 'img' : null;
      this.internals.ariaLabel  = label || null;
      this.internals.ariaHidden = label ? null : 'true';
    }
  }
}

SvgSprite.init();
