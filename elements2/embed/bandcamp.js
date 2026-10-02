// <embed-bandcamp>
// a bandcamp release or track behind a click. bandcamp embeds by a numeric id
// that the pages do not show in their url: take it from bandcamp's own embed
// code (share / embed). the whole iframe snippet, its src or the bare id work.
//
//   <embed-bandcamp src="3119776030"></embed-bandcamp>
//   <embed-bandcamp src="https://bandcamp.com/EmbeddedPlayer/album=3119776030/…" look="slim"></embed-bandcamp>
//   <embed-bandcamp src="1234567890" type="track" look="wide"></embed-bandcamp>
//
// looks, as bandcamp's embed dialog offers them:
//   slim            one line, with the artwork              42px
//   slim-plain      one line, without the artwork           42px
//   standard        artwork, player, tracklist              350 × 522px (default)
//   standard-short  artwork and player, no tracklist        350 × 470px
//   artwork         the artwork alone, playable             350 × 350px
//   wide            player with a small artwork             120px
//
// the colors follow the palette: bgcol from --color-bg, linkcol from
// --color-ink, both as hex without #, `bgcol` and `linkcol` override them.
// an album page url cannot be embedded, the placeholder then links to it.

import { EmbedComponent } from '../core/EmbedComponent.js';

const PLAYER = 'https://bandcamp.com/EmbeddedPlayer/';

export const LOOKS = {
  artwork          : { height: '350px', size: 'large', width: '350px', extra: { minimal: 'true' } },
  slim             : { height: '42px',  size: 'small' },
  'slim-plain'     : { height: '42px',  size: 'small', extra: { artwork: 'none' } },
  standard         : { height: '522px', size: 'large', width: '350px' },
  'standard-short' : { height: '470px', size: 'large', width: '350px', extra: { tracklist: 'false' } },
  wide             : { height: '120px', size: 'large', extra: { artwork: 'small', tracklist: 'false' } },
};

// a track has no tracklist, its standard look is the short one
const lookOf = (look, type) => type === 'track' && look === 'standard' ? LOOKS['standard-short'] : LOOKS[look] ?? LOOKS.standard;

/** { type, id } from an iframe snippet, a player url or a bare id. null for anything else */
export function parseBandcamp (src, type = 'release') {
  if (/^\d+$/.test(src)) return { id: src, type };

  const player = src.match(/bandcamp\.com\/EmbeddedPlayer\/[^"'\s>]+/)?.[0];
  if (!player) return null;

  const [, key, id] = player.match(/\/(album|track)=(\d+)/) ?? [];
  return id ? { id, type: key === 'album' ? 'release' : 'track' } : null;
}

// a css color as 'rrggbb', through a pixel: computed styles keep oklch() and
// light-dark() as they are, a canvas always answers in srgb
function hexOf (element, color) {
  const probe = document.createElement('span');
  probe.hidden      = true;
  probe.style.color = color;
  element.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  const context = Object.assign(document.createElement('canvas'), { height: 1, width: 1 }).getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.fillStyle = computed;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return [red, green, blue].map(channel => channel.toString(16).padStart(2, '0')).join('');
}

export class EmbedBandcamp extends EmbedComponent {

  static attr = {
    bgcol   : String,   // hex without #, --color-bg by default
    linkcol : String,   // hex without #, --color-ink by default
    look    : { type: String, default: 'standard', values: Object.keys(LOOKS) },
    type    : { type: String, default: 'release', values: ['release', 'track'] },
  };

  static reflect = ['look'];

  toUrl (src) {
    const parsed = parseBandcamp(src, this.getAttr('type'));
    if (!parsed) return src;

    const { bgcol, linkcol, look } = this.getAttr();
    const { extra = {}, size }     = lookOf(look, parsed.type);

    const settings = {
      [parsed.type === 'track' ? 'track' : 'album'] : parsed.id,
      size,
      bgcol       : (bgcol   ?? hexOf(this, 'var(--color-bg)')  ?? 'ffffff').replace('#', ''),
      linkcol     : (linkcol ?? hexOf(this, 'var(--color-ink)') ?? '0687f5').replace('#', ''),
      ...extra,
      transparent : 'true',
    };

    return PLAYER + Object.entries(settings).map(([key, value]) => `${key}=${value}/`).join('');
  }

  // the look's size for a player, the element's default for the link to a page
  sizes () {
    const { look, src, type } = this.getAttr();
    const parsed = parseBandcamp(src?.trim() ?? '', type);
    if (!parsed) return {};

    const { height, width } = lookOf(look, parsed.type);
    return { height, width };
  }
}

EmbedBandcamp.init('embed-bandcamp');

export default EmbedBandcamp;
