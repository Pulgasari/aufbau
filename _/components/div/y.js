// <div-y>
// a column: a flex container along the y axis, the counterpart of <div-x>.
// `scrollable` lets it scroll along its axis instead of growing.
//
//   <div-y>…</div-y>
//   <div-y scrollable>…</div-y>

import { AufbauElement } from '@aufbau/elements/core/index.js';

import { define, tagOf } from '../core/names.js';

export class DivY extends AufbauElement {

  static attr = {
    scrollable : Boolean,
  };

  static styles () {
    return `${tagOf('div-y')} {
      display        : flex;
      flex-direction : column;

      &[scrollable] {
        min-block-size : 0;
        overflow-y     : auto;
      }
    }`;
  }
}

define('div-y', DivY);

export default DivY;
