import { AufbauElement } from '../base/AufbauElement.js';

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const siblingsOf = view => [...(view.parentElement?.children ?? [])].filter(element => element.localName === view.localName);

export class AppView extends AufbauElement {

  static attr = {
    active        : Boolean,
    lazy          : Boolean,
    name          : String,
    route         : String,
    transitionOff : String,
    transitionOn  : String,
  };

  static styles () {
    return `app-view {
      display: block;

      &:not([active]) {
        content-visibility : hidden;
        position           : absolute;
      }
    }
    ${transitionStyles}`;
  }

  get active () { return this.hasAttribute('active'); }
  set active (active) { if (active) this.activate(); else this.toggleAttribute('active', false); }

  // the app-root this view belongs to, null outside of one
  get root () { return this.closest('app-root'); }

  onConnected () {
    this.inert = !this.active;
    if (this.active) this.fill();

    const path = this.root?.path;
    if (path != null && !this.active && this.getAttr('route') === path) this.activate({ history: false, transition: false });
  }

  onAttributeChanged (name, oldValue, newValue) {
    if (name !== 'active' || this._switching) return;

    if (newValue == null) { this.inert = true; return; }

    this._switching = true;
    this.removeAttribute('active');
    this._switching = false;
    this.activate();
  }

  activate ({ history = true, transition = true } = {}) {
    const from = siblingsOf(this).find(view => view !== this && view.active) ?? null;
    if (this.active && !from) return Promise.resolve();

    const root = this.root;
    const swap = () => {
      for (const view of siblingsOf(this)) if (view !== this) view.hide();
      this.show();
    };

    if (history && this.getAttr('route')) root?.remember?.(this);

    const done = transition ? runTransition({ from, root, swap, to: this }) : Promise.resolve(swap());
    root?.emit?.('navigate', { from: from?.getAttr('name') ?? null, to: this.getAttr('name') ?? null });
    return done;
  }

  show () {
    this._switching = true;
    this.setAttribute('active', '');
    this._switching = false;
    this.inert = false;
    this.fill();
    this.emit('activate');
  }

  hide () {
    if (!this.active) return;
    this._switching = true;
    this.removeAttribute('active');
    this._switching = false;
    this.inert = true;
    this.emit('deactivate');
  }

  // a lazy view gets its template on the first activation
  fill () {
    if (!this.getAttr('lazy') || this._filled) return;
    const template = this.querySelector(':scope > template');
    if (!template) return;
    this._filled = true;
    this.append(template.content.cloneNode(true));
  }
}

// :::::: TRANSITION ::::::::::::::::::::::::::::::::::::::::::::

const OUT = 'app-view-out';
const IN  = 'app-view-in';

function runTransition ({ from, root, swap, to }) {
  const fallback = root?.getAttr?.('transition') ?? 'fade';
  const on       = to.getAttr('transitionOn')    ?? fallback;
  const off      = from?.getAttr('transitionOff') ?? fallback;

  if (!document.startViewTransition || reducedMotion() || (on === 'none' && off === 'none')) {
    swap();
    return Promise.resolve();
  }

  const html = document.documentElement;
  html.style.setProperty('--app-view-on',  on  === 'none' ? 'none' : on);
  html.style.setProperty('--app-view-off', off === 'none' ? 'none' : off);
  if (from) from.style.viewTransitionName = OUT;

  const transition = document.startViewTransition({
    types  : ['app-view'],
    update : () => {
      if (from) from.style.viewTransitionName = '';
      to.style.viewTransitionName = IN;
      swap();
    },
  });

  return transition.finished.finally(() => {
    to.style.viewTransitionName = '';
    html.style.removeProperty('--app-view-on');
    html.style.removeProperty('--app-view-off');
  });
}

export const transitionStyles = `
  html:active-view-transition-type(app-view) {
    &::view-transition-old(root),
    &::view-transition-new(root) { animation: none; }

    &::view-transition-group(${IN}),
    &::view-transition-group(${OUT}) { animation-duration: var(--app-view-duration, 0.25s); }

    &::view-transition-new(${IN}) {
      --animate-offset : if(style(--app-view-on: glide): 2rem 0; else: 100% 0);
      animation        : var(--app-view-duration, 0.25s) ease both;
      animation-name   : var(--app-view-on, fade);
    }

    &::view-transition-old(${OUT}) {
      --animate-offset : if(style(--app-view-off: glide): -2rem 0; else: -100% 0);
      animation        : var(--app-view-duration, 0.25s) ease both reverse;
      animation-name   : var(--app-view-off, fade);
    }
  }
`;

AppView.init('app-view');

export default AppView;
