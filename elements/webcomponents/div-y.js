import { AufbauElement } from '@aufbau/element';

export class DivY extends AufbauElement {

  static attr = {
    scrollable : Boolean,
  };

  static styles () {
    return `div-y {
      display        : flex;
      flex-direction : column;
      min-height     : stretch;
      place-content  : safe center;

      &[scrollable] {
        min-block-size : 0;
        overflow-y     : auto;
      }
    }`;
  }
}

DivY.init('div-y');

export default DivY;
