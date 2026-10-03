import { AufbauElement } from '../base/index.js';

export class DivX extends AufbauElement {

  static attr = {
    scrollable : Boolean,
  };

  static styles () {
    return `div-x {
      display        : flex;
      flex-direction : row;

      &[scrollable] {
        min-inline-size : 0;
        overflow-x      : auto;
      }
    }`;
  }
}

DivX.init('div-x');

export default DivX;
