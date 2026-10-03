import { EmbedComponent } from '../base/EmbedComponent.js';

const PLAYER = 'https://bandcamp.com/EmbeddedPlayer/';

export const LOOKS = {
  artwork          : { height: '350px', size: 'large', width: '350px', extra: { minimal: 'true' } },
  slim             : { height: '42px',  size: 'small' },
  'slim-plain'     : { height: '42px',  size: 'small', extra: { artwork: 'none' } },
  standard         : { height: '522px', size: 'large', width: '350px' },
  'standard-short' : { height: '470px', size: 'large', width: '350px', extra: { tracklist: 'false' } },
  wide             : { height: '120px', size: 'large', extra: { artwork: 'small', tracklist: 'false' } },
};

const lookOf = (look, type) => type === 'track' && look === 'standard' ? LOOKS['standard-short'] : LOOKS[look] ?? LOOKS.standard;

export function parseBandcamp (src, type = 'release') {
  if (/^\d+$/.test(src)) return { id: src, type };

  const player = src.match(/bandcamp\.com\/EmbeddedPlayer\/[^"'\s>]+/)?.[0];
  if (!player) return null;

  const [, key, id] = player.match(/\/(album|track)=(\d+)/) ?? [];
  return id ? { id, type: key === 'album' ? 'release' : 'track' } : null;
}

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
