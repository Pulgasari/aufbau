import { AufbauElement } from '../base/AufbauElement.js';

export class DivY extends AufbauElement {

  static attr = {
    scrollable : Boolean,
  };

  static styles () {
    return `div-y {
      display        : flex;
      flex-direction : column;

      &[scrollable] {
        min-block-size : 0;
        overflow-y     : auto;
      }
    }`;
  }
}

DivY.init('div-y');

export default DivY;
