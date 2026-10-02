// <div-y>
// a column: a flex container along the y axis, the counterpart of <div-x>.
// `scrollable` lets it scroll along its axis instead of growing.
//
//   <div-y>…</div-y>
//   <div-y scrollable>…</div-y>

import { AufbauElement } from '../core/index.js';


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
