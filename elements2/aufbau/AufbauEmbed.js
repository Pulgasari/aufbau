// <aufbau-embed>
// third party content (a video, a song, a post) behind a click. until then the
// element is a local placeholder and nothing is requested from the provider,
// not even a thumbnail: the page's own `poster` is the only image. the click
// swaps in the provider's player.
//
//   <aufbau-embed src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></aufbau-embed>
//   <aufbau-embed src="https://open.spotify.com/album/…" remember></aufbau-embed>
//   <aufbau-embed src="https://example.com/widget" height="400px" label="widget"></aufbau-embed>
//
// providers are recognized by the url: youtube, vimeo, spotify, soundcloud,
// bandcamp (the EmbeddedPlayer url, an album page cannot be embedded), mastodon
// posts. any other url is framed as it is. a url that cannot be framed turns the
// placeholder into a link.
//
// consent="auto" loads at once, e.g. once the page asked for consent itself.
// it can come from <aufbau-config embed-consent="auto">. `remember` stores a
// click per provider, later embeds of it load at once. state: :state(active).
// event: `activate` with { provider, src }.

import { AufbauElement } from '../core/index.js';
import { attrs, html }   from '../core/html.js';
import { store }         from '../core/persist.js';

const ALLOW = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';

// :::::: PROVIDERS :::::::::::::::::::::::::::::::::::::::::::::
// test(url) answers what the embed needs, null where the url is not the
// provider's. embed(match, url) gives the player url, null where the url is the
// provider's but has nothing to play: the placeholder then links to it.
// ratio or height size the player

const youtubeId = url => {
  if (/(^|\.)youtu\.be$/.test(url.hostname)) return url.pathname.slice(1).split('/')[0] || null;
  if (url.searchParams.has('v')) return url.searchParams.get('v');
  return url.pathname.match(/^\/(?:embed|live|shorts)\/([\w-]+)/)?.[1] ?? null;
};

// '1m30s', '90' -> 90
const seconds = value => {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const [, h = 0, m = 0, s = 0] = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/) ?? [];
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

export const PROVIDERS = [
  {
    name  : 'youtube',
    label : 'YouTube',
    ratio : '16 / 9',
    test  : url => /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/.test(url.hostname) ? youtubeId(url) ?? '' : null,
    embed : (id, url) => {
      if (!id) return null;
      const start = seconds(url.searchParams.get('t') ?? url.searchParams.get('start'));
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0${start ? `&start=${start}` : ''}`;
    },
  },
  {
    name  : 'vimeo',
    label : 'Vimeo',
    ratio : '16 / 9',
    test  : url => /(^|\.)vimeo\.com$/.test(url.hostname) ? url.pathname.match(/(?:^|\/)(\d+)(?:\/|$)/)?.[1] ?? '' : null,
    embed : id => id ? `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1` : null,
  },
  {
    name   : 'spotify',
    label  : 'Spotify',
    height : match => ['episode', 'track'].includes(match.type) ? '152px' : '352px',
    test   : url => {
      if (url.hostname !== 'open.spotify.com') return null;
      const [, type, id] = url.pathname.match(/^(?:\/intl-[\w-]+)?(?:\/embed)?\/(album|artist|episode|playlist|show|track)\/(\w+)/) ?? [];
      return type ? { id, type } : null;
    },
    embed  : ({ id, type }) => `https://open.spotify.com/embed/${type}/${id}`,
  },
  {
    name   : 'soundcloud',
    label  : 'SoundCloud',
    height : () => '166px',
    test   : url => /(^|\.)soundcloud\.com$/.test(url.hostname) && url.hostname !== 'w.soundcloud.com' ? url.href : null,
    embed  : href => `https://w.soundcloud.com/player/?url=${encodeURIComponent(href)}&auto_play=true&visual=false`,
  },
  {
    name   : 'bandcamp',
    label  : 'Bandcamp',
    height : () => '120px',
    test   : url => /(^|\.)bandcamp\.com$/.test(url.hostname) ? url.href : null,
    embed  : (href, url) => url.pathname.startsWith('/EmbeddedPlayer') ? href : null,
  },
  {
    name   : 'mastodon',
    label  : 'Mastodon',
    height : () => '400px',
    test   : url => /^\/@[\w.-]+\/\d+\/?$/.test(url.pathname) ? url.href.replace(/\/$/, '') : null,
    embed  : href => `${href}/embed`,
  },
];

const GENERIC = { name: 'web', ratio: '16 / 9', test: url => url.href, embed: href => href };

/** { provider, src, link, host, ratio, height } for a url, null where it is none */
export function resolveEmbed (source) {
  let url;
  try { url = new URL(source, location.href); } catch { return null; }
  if (!/^https?:$/.test(url.protocol)) return null;

  for (const provider of [...PROVIDERS, GENERIC]) {
    const match = provider.test(url);
    if (match == null) continue;

    const src = provider.embed(match, url);
    return {
      height   : provider.height?.(match) ?? null,
      host     : src ? new URL(src).hostname : url.hostname,
      label    : provider.label ?? url.hostname,
      link     : url.href,
      provider : provider.name,
      ratio    : provider.ratio ?? null,
      src,
    };
  }
  return null;
}

// :::::: ELEMENT :::::::::::::::::::::::::::::::::::::::::::::::

export default class AufbauEmbed extends AufbauElement {

  static attr = {
    consent  : { type: String, default: 'click', values: ['auto', 'click'], config: true },
    height   : String,   // a css length, the player is that high instead of keeping a ratio
    label    : String,   // the name on the placeholder and of the frame, the provider's by default
    poster   : String,   // an image of the page's own, shown on the placeholder
    ratio    : String,   // e.g. '4 / 3', wins over the provider's
    remember : Boolean,
    src      : String,
    width    : String,   // a css length, at most the available width
  };

  static styles = `aufbau-embed {
    aspect-ratio    : var(--embed-ratio, 16 / 9);
    background      : center / cover no-repeat var(--embed-poster, none);
    block-size      : var(--embed-height, auto);
    container-type  : size;
    display         : block;
    inline-size     : var(--embed-width, 100%);
    max-inline-size : 100%;

    > iframe {
      block-size  : 100%;
      border      : 0;
      display     : block;
      inline-size : 100%;
    }

    > :is(button, a) {
      align-items     : center;
      background      : none;
      block-size      : 100%;
      border          : 0;
      color           : inherit;
      cursor          : pointer;
      display         : flex;
      flex-direction  : column;
      font            : inherit;
      gap             : 0.25em;
      inline-size     : 100%;
      justify-content : center;
      margin          : 0;
      text-align      : center;
      text-decoration : none;

      > aufbau-icon { font-size: 2em; }
      > small       { font-size: 0.75em; }
    }

    /* a slim player, e.g. 42px: the placeholder is one line */
    @container (max-height: 80px) {
      > :is(button, a) { flex-direction: row; gap: 0.5em; }
      > :is(button, a) > aufbau-icon { font-size: 1em; }
    }
  }`;

  /** what the src resolves to, see resolveEmbed() */
  get embed () {
    const src = this.getAttr('src');
    if (src !== this._resolvedSrc) {
      this._resolvedSrc = src;
      this._embed       = src ? resolveEmbed(src) : null;
    }
    return this._embed;
  }

  get active   () { return Boolean(this._active); }
  get storeKey () { return `embed:consent:${this.embed?.provider}`; }

  // consent given before: for every embed, or remembered for this provider
  get consented () {
    if (this.getAttr('consent') === 'auto') return true;
    return Boolean(this.getAttr('remember') && store.getSync(this.storeKey));
  }

  /** loads the player. what the click does, callable from outside as well */
  activate () {
    const embed = this.embed;
    if (!embed?.src || this._active) return this;

    this._active = true;
    if (this.getAttr('remember')) store.setSync(this.storeKey, true);
    this.update();
    this.emit('activate', { provider: embed.provider, src: embed.src });
    return this;
  }

  onMount () {
    this.on('click', 'button', (event, button) => { if (button.parentNode === this) this.activate(); });
  }

  onAttributeChange (name) {
    if (name === 'src') this._active = false;
  }

  render () {
    const embed = this.embed;
    if (!embed) return '';

    if (!this._active && embed.src && this.consented) this._active = true;

    const name = this.getAttr('label') || embed.label;

    if (this._active) return html`
      <iframe ${attrs({ allow: ALLOW, loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin', src: embed.src, title: name })}></iframe>
    `;

    // nothing to frame: the placeholder leads to the page itself
    if (!embed.src) return html`
      <a href="${embed.link}" target="_blank" rel="noopener noreferrer">
        <aufbau-icon icon="lucide:external-link"></aufbau-icon>
        <strong>${name}</strong>
        <small>opens ${embed.host}</small>
      </a>
    `;

    return html`
      <button type="button" aria-label="${`load ${name} from ${embed.host}`}">
        <aufbau-icon icon="lucide:play"></aufbau-icon>
        <strong>${name}</strong>
        <small>loads content from ${embed.host}</small>
      </button>
    `;
  }

  sync () {
    const embed = this.embed;
    const { height, poster, ratio, width } = this.getAttr();
    const fixed = height || (!ratio && embed?.height);

    this.states.toggle('active', this.active);
    this.style.setProperty('--embed-ratio', fixed ? 'auto' : (ratio || embed?.ratio || '16 / 9'));
    if (fixed) this.style.setProperty('--embed-height', fixed); else this.style.removeProperty('--embed-height');
    if (poster) this.style.setProperty('--embed-poster', `url(${JSON.stringify(poster)})`); else this.style.removeProperty('--embed-poster');
    if (width)  this.style.setProperty('--embed-width', width); else this.style.removeProperty('--embed-width');
  }
}

AufbauEmbed.init();
