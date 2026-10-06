import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// a file shown by what its type asks for: media-audio, media-video, media-gif,
// media-pdf, media-json, media-font, an image. anything else becomes a download
// link. type overrides what the extension says
const KINDS = {
  audio : ['flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav'],
  font  : ['otf', 'ttf', 'woff', 'woff2'],
  gif   : ['gif'],
  image : ['apng', 'avif', 'bmp', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
  json  : ['json'],
  pdf   : ['pdf'],
  video : ['m4v', 'mkv', 'mov', 'mp4', 'ogv', 'webm'],
};

const TYPES = { 'application/json': 'json', 'application/pdf': 'pdf', 'image/gif': 'gif' };

const ELEMENTS = {
  audio : './media-audio.js',
  font  : './media-font.js',
  gif   : './media-gif.js',
  json  : './media-json.js',
  pdf   : './media-pdf.js',
  video : './media-video.js',
};

function kindOf (src, type) {
  if (type) return TYPES[type] ?? type.split('/')[0];
  const extension = String(src).split(/[?#]/)[0].split('.').pop().toLowerCase();
  return Object.keys(KINDS).find(kind => KINDS[kind].includes(extension)) ?? 'file';
}

export default class MediaFile extends AufbauElement {
  static attr = {
    label : String,
    src   : String,
    type  : String,   // a mime type
  };

  static styles = `media-file {
    display: block;

    > img { display: block; inline-size: 100%; }
  }`;

  get kind () { return kindOf(this.getAttr('src'), this.getAttr('type')); }

  render () {
    const { label, src } = this.getAttr();
    if (!src) return '';

    const kind = this.kind;
    const name = label ?? decodeURIComponent(src.split(/[?#]/)[0].split('/').pop());
    if (ELEMENTS[kind]) import(ELEMENTS[kind]);

    if (kind === 'audio') return html`<media-audio ${attrs({ label: name, src })}></media-audio>`;
    if (kind === 'video') return html`<media-video ${attrs({ src })}></media-video>`;
    if (kind === 'font')  return html`<media-font ${attrs({ src })}></media-font>`;
    if (kind === 'gif')   return html`<media-gif ${attrs({ alt: label ?? '', src })}></media-gif>`;
    if (kind === 'image') return html`<img ${attrs({ alt: label ?? '', src })}>`;
    if (kind === 'json')  return html`<media-json ${attrs({ label: name, src })}></media-json>`;
    if (kind === 'pdf')   return html`<media-pdf ${attrs({ label: name, src })}></media-pdf>`;
    return html`<a ${attrs({ download: true, href: src })}>${name}</a>`;
  }
}

MediaFile.init();
