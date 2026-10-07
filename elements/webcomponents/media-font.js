import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// a font file as a specimen: its name, a sample at a few sizes and the
// characters. the face is registered under `family`, or a name of its own
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 äöüß ?!&@#%*()[]{}';

let count = 0;

export default class MediaFont extends AufbauElement {
  static attr = {
    family : String,
    sizes  : '16 24 36 56',
    src    : String,
    text   : 'The quick brown fox jumps over the lazy dog',
  };

  static styles = `media-font {
    display        : flex;
    flex-direction : column;
    gap            : --space(tiny);

    > header { font-size: 0.8em; opacity: 0.7; }
    > p      { line-height: 1.2; margin: 0; overflow-wrap: anywhere; }
    > p[part="glyphs"] { font-size: 1.5em; letter-spacing: 0.05em; }

    &[failed]::before { content: 'not a font'; opacity: 0.6; }
  }`;

  name = `media-font-${++count}`;

  get familyName () { return this.getAttr('family') || this.fileName || this.name; }

  get fileName () { return decodeURIComponent(String(this.getAttr('src') ?? '').split(/[?#]/)[0].split('/').pop().replace(/\.[^.]+$/, '')); }

  async load () {
    const src = this.getAttr('src');
    if (!src || src === this._loaded) return;
    this._loaded = src;

    try {
      const face = new FontFace(this.familyName, `url("${new URL(src, document.baseURI).href}")`);
      document.fonts.add(await face.load());
      this.removeAttribute('failed');
    }
    catch (error) {
      this.setAttribute('failed', '');
      console.warn(`[media-font] ${src}:`, error);
    }
  }

  render () {
    const { sizes, src, text } = this.getAttr();
    if (!src) return '';
    const family = `font-family: "${this.familyName}", var(--font-fallback, sans-serif)`;

    return html`
      <header>${this.familyName}</header>
      ${String(sizes).split(/\s+/).filter(Boolean).map(size => html`<p ${attrs({ style: `${family}; font-size: ${Number(size) || 16}px` })}>${text}</p>`)}
      <p part="glyphs" ${attrs({ style: family })}>${GLYPHS}</p>
    `;
  }

  sync () { this.load(); }
}

MediaFont.init();
