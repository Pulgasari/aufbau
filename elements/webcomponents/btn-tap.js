import { Btn } from './btn/Btn.js';

// a light button for menus, toolbars, secondary actions: no fill until hovered
export default class BtnTap extends Btn {
  static styles = `:host { padding: var(--btn-padding, --space(small)); }`;
}

BtnTap.init();
