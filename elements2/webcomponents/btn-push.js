import { Btn } from './btn/Btn.js';

// the button that does the main thing: filled
export default class BtnPush extends Btn {
  static reflect = ['variant'];

  static attr = { variant: 'default' };

  static styles = `
    :host {
      --btn-background : color-mix(in oklab, currentColor 12%, transparent);

      background-color : var(--btn-background);
      padding          : var(--btn-padding, 0.5em 1em);
    }
  `;
}

BtnPush.init();
