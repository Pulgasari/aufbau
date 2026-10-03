// <div-x>
// a row: a flex container along the x axis, the counterpart of <div-y>.
// `scrollable` lets it scroll along its axis instead of growing.
//
//   <div-x>…</div-x>
//   <div-x scrollable>…</div-x>

import { AufbauElement } from '@aufbau/elements/core/index.js';

import { define, tagOf } from '../core/names.js';

export class DivX extends AufbauElement {

  static attr = {
    scrollable : Boolean,
  };

  static styles () {
    return `${tagOf('div-x')} {
      display        : flex;
      flex-direction : row;

      &[scrollable] {
        min-inline-size : 0;
        overflow-x      : auto;
      }
    }`;
  }
}

define('div-x', DivX);

export default DivX;
