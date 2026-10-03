// <app-float>
// things floating over their container: an action button, a speed dial, a
// note. placed on one of nine anchors, its children stack in `direction`.
//
//   <app-float anchor="bottom-end" direction="up">
//     <aufbau-button icon="lucide:folder-plus" label="new folder"></aufbau-button>
//   </app-float>
//
// anchor     top-start | top | top-end | start | center | end |
//            bottom-start | bottom | bottom-end (default)
// direction  up (default) | down | start | end
//
// positioned absolutely, so it floats over the nearest positioned ancestor: an
// <app-area> or an <app-view>. only the children take the pointer, the gaps
// between them let it through. --float-offset is the distance to the edges,
// --float-gap the one between the children.

import { AufbauElement } from '@aufbau/elements/core/index.js';

import { define, tagOf } from '../core/names.js';

export class AppFloat extends AufbauElement {

  static attr = {
    anchor    : { type: String, default: 'bottom-end', values: ['bottom', 'bottom-end', 'bottom-start', 'center', 'end', 'start', 'top', 'top-end', 'top-start'] },
    direction : { type: String, default: 'up', values: ['down', 'end', 'start', 'up'] },
  };

  static reflect = ['anchor', 'direction'];

  static styles () {
    return `${tagOf('app-float')} {
      --float-offset : 1rem;

      align-items    : center;
      display        : flex;
      flex-direction : column-reverse;
      gap            : var(--float-gap, 0.75rem);
      pointer-events : none;
      position       : absolute;
      z-index        : var(--float-z, 10);

      > * { pointer-events: auto; }

      &[direction="down"]  { flex-direction: column; }
      &[direction="start"] { flex-direction: row-reverse; }
      &[direction="end"]   { flex-direction: row; }

      &[anchor^="top"]    { inset-block-start  : var(--float-offset); }
      &[anchor^="bottom"] { inset-block-end    : calc(var(--float-offset) + env(safe-area-inset-bottom, 0px)); }
      &[anchor$="start"]  { inset-inline-start : var(--float-offset); }
      &[anchor$="end"]    { inset-inline-end   : var(--float-offset); }

      /* the middle of an axis */
      &:is([anchor="top"], [anchor="bottom"], [anchor="center"]) { inset-inline-start: 50%; translate: -50% 0; }
      &:is([anchor="start"], [anchor="end"], [anchor="center"])  { inset-block-start: 50%; translate: 0 -50%; }
      &[anchor="center"] { translate: -50% -50%; }
    }`;
  }
}

define('app-float', AppFloat);

export default AppFloat;
