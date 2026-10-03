// @aufbau/elements2/base/EmbedComponent.js
// the base of every embed-* component: one <aufbau-embed>, fed with the url a
// subclass builds from what the author gave: a url, an id, a type. consent,
// sizing and the placeholder are the element's, its attributes are forwarded.

import '../aufbau/AufbauEmbed.js';

import { AufbauElement } from './index.js';
import setAttr           from '@domina/methods/setAttr.js';

const FORWARD = ['consent', 'height', 'label', 'poster', 'ratio', 'remember', 'width'];

export class EmbedComponent extends AufbauElement {

  static attr = {
    consent  : String,
    height   : String,
    label    : String,
    poster   : String,
    ratio    : String,
    remember : Boolean,
    src      : String,
    width    : String,
  };

  get embed () { return this.querySelector(':scope > aufbau-embed'); }

  /** hook, the url <aufbau-embed> resolves, from the src and the own attributes */
  toUrl (src) { return src; }

  /** hook, sizes that depend on the own attributes, e.g. a player style. the author's win */
  sizes () { return {}; }

  /** loads the player, see AufbauEmbed.activate() */
  activate () { this.embed?.activate(); return this; }

  render () { return '<aufbau-embed></aufbau-embed>'; }

  sync () {
    const embed = this.embed;
    if (!embed) return;

    const values = this.getAttr();
    const sizes  = this.sizes();
    const src    = values.src ? this.toUrl(values.src.trim()) : null;

    setAttr(embed, {
      ...Object.fromEntries(FORWARD.map(name => [name, values[name] ?? sizes[name] ?? false])),
      src: src ?? false,
    });
  }
}

/** the url of a src that already is one, null for anything else */
export const urlOf = src => { try { return new URL(src).href; } catch { return null; } };

export default EmbedComponent;
