import '../aufbau-embed.js';

import { AufbauElement } from '../../base/AufbauElement.js';
import setAttr           from '@domina/methods/setAttr.js';

const FORWARD = ['consent', 'height', 'label', 'poster', 'ratio', 'remember', 'width'];

export class Embed extends AufbauElement {

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

  toUrl (src) { return src; }

  sizes () { return {}; }

  // loads the player, see AufbauEmbed.activate()
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

export const urlOf = src => { try { return new URL(src).href; } catch { return null; } };

export default Embed;
