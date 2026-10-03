// <app-view>
// one screen of an app. of the views that share a parent one is active, the
// others are inert and not rendered (content-visibility: hidden): their dom,
// form values and scroll position stay, showing them again costs nothing.
//
//   <app-view name="library" route="/" active>…</app-view>
//   <app-view name="reader" route="/reader" transition-on="slide" transition-off="fade">…</app-view>
//   <app-view name="settings" lazy><template>…</template></app-view>
//
// activate() switches to it inside a view transition, so does setting `active`
// from outside. transition-on / transition-off name a one-way keyframe of
// aufbau's animate/keyframes.css (fade, glide, slide, zoom, pop, focus, reveal,
// iris, tilt-in, rotate-in) or none,
// the app-root's `transition` is the default for both. `lazy` renders the
// <template> child on the first activation. `route` puts the view into the
// address, see <app-root routing>.
//
// events: activate and deactivate on the views, navigate { from, to } on the root.

import { AufbauElement } from '../base/index.js';


const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** the views a view is exclusive with: the app-views of the same parent */
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

      /* out of the flow as well: in a flex or grid layout a hidden view would
         still take its share of the space */
      &:not([active]) {
        content-visibility : hidden;
        position           : absolute;
      }
    }
    ${transitionStyles}`;
  }

  get active () { return this.hasAttribute('active'); }
  set active (active) { if (active) this.activate(); else this.toggleAttribute('active', false); }

  /** the app-root this view belongs to, null outside of one */
  get root () { return this.closest('app-root'); }

  // a view added after its root (a framework rendering them one by one) follows the address itself
  onMount () {
    this.inert = !this.active;
    if (this.active) this.fill();

    const path = this.root?.path;
    if (path != null && !this.active && this.getAttr('route') === path) this.activate({ history: false, transition: false });
  }

  // an `active` written from outside (markup, a framework) switches like activate(): the
  // attribute is taken back at once and set again inside the transition
  onAttributeChange (name, oldValue, newValue) {
    if (name !== 'active' || this._switching) return;

    if (newValue == null) { this.inert = true; return; }

    this._switching = true;
    this.removeAttribute('active');
    this._switching = false;
    this.activate();
  }

  /** shows this view, hides its siblings. `history: false` leaves the address as it is */
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
// the leaving view is captured as app-view-out, the coming one as app-view-in.
// the keyframe names ride on custom properties of the root element, which the
// ::view-transition pseudo elements inherit

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

/** the view transition styles, global: the pseudo elements hang off the document */
export const transitionStyles = `
  html:active-view-transition-type(app-view) {
    &::view-transition-old(root),
    &::view-transition-new(root) { animation: none; }

    &::view-transition-group(${IN}),
    &::view-transition-group(${OUT}) { animation-duration: var(--app-view-duration, 0.25s); }

    /* --animate-offset is registered without inheritance, the keyframes' fallback never
       reaches the pseudo elements: the coming view slides in from the end, the leaving one
       out to the start, a glide only a short way */
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
