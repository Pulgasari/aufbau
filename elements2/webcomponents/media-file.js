import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// a file shown by what its type asks for: media-audio, media-video, an image, a pdf.
// anything else becomes a download link. type overrides what the extension says
const KINDS = {
  audio : ['flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav'],
  image : ['apng', 'avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'],
  pdf   : ['pdf'],
  video : ['m4v', 'mkv', 'mov', 'mp4', 'ogv', 'webm'],
};

const ELEMENTS = { audio: './media-audio.js', video: './media-video.js' };

function kindOf (src, type) {
  if (type) return type === 'application/pdf' ? 'pdf' : type.split('/')[0];
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

    > :is(iframe, img) { border: 0; display: block; inline-size: 100%; }
    > iframe           { aspect-ratio: 1 / 1.414; }
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
    if (kind === 'image') return html`<img ${attrs({ alt: label ?? '', src })}>`;
    if (kind === 'pdf')   return html`<iframe ${attrs({ src, title: name })}></iframe>`;
    return html`<a ${attrs({ download: true, href: src })}>${name}</a>`;
  }
}

MediaFile.init();
