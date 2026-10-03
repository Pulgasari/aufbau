import { AufbauElement } from '../base/index.js';

export class AppFloat extends AufbauElement {

  static attr = {
    anchor    : { type: String, default: 'bottom-end', values: ['bottom', 'bottom-end', 'bottom-start', 'center', 'end', 'start', 'top', 'top-end', 'top-start'] },
    direction : { type: String, default: 'up', values: ['down', 'end', 'start', 'up'] },
  };

  static reflect = ['anchor', 'direction'];

  static styles () {
    return `app-float {
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

      &:is([anchor="top"], [anchor="bottom"], [anchor="center"]) { inset-inline-start: 50%; translate: -50% 0; }
      &:is([anchor="start"], [anchor="end"], [anchor="center"])  { inset-block-start: 50%; translate: 0 -50%; }
      &[anchor="center"] { translate: -50% -50%; }
    }`;
  }
}

AppFloat.init('app-float');

export default AppFloat;
