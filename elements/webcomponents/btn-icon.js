import { Btn }  from './btn/Btn.js';
import { html } from '../lib/html.js';

// only an icon. the label, the children or the command name it for assistive tech
export default class BtnIcon extends Btn {
  static styles = `
    :host {
      aspect-ratio : 1;
      font-size    : var(--btn-icon-size, 1.15em);
      padding      : var(--btn-padding, --space(tiny));
    }

    [part="label"] { display: none; }
  `;

  render () {
    return html`<svg-icon part="icon" icon="${this.iconName ?? ''}"></svg-icon><span part="label"><slot></slot></span>`;
  }

  sync () {
    super.sync();
    if (this.internals) this.internals.ariaLabel = this.getAttr('label') ?? (this.textContent.trim() || this.preset.label) ?? null;
  }
}

BtnIcon.init();
