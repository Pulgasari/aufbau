// <app-area>
// a region of an app-root. `name` says what it is, `dock` where it sits:
//
//   <app-root>
//     <app-area name="main">…app-views…</app-area>
//     <app-area name="menu"    dock="start">…</app-area>
//     <app-area name="config"  dock="end">…</app-area>
//     <app-area name="context" dock="bottom" peek>…</app-area>
//   </app-root>
//
// an area without dock is the main one: it holds the views and fills what the
// docked ones leave. a docked area is a sidebar (start, end) or a sheet below
// the main area (bottom) on wide screens, and a drawer over the app on narrow
// ones (overlay). `overlay` forces either: always, never, auto (below
// `breakpoint`, 48rem by default).
//
// open      shown. a closed area takes no space, as a drawer it is off screen
// expanded  wider (start, end: --area-expanded-size, 50vw) or taller (bottom),
//           full screen as a drawer
// peek      a closed drawer leaves its handle on screen, to be pulled in
//
// the handle opens and closes the drawer by dragging or a tap; dragging a
// bottom sheet further up expands it. there is no swipe from the screen edge on
// purpose: android takes those for back and home. escape and the scrim close a
// drawer, the rest of the app is inert while one is open. one drawer at a time:
// opening one closes the others.
//
// methods: show(), hide(), toggle(force), expand(force)
// events:  toggle { open, expanded }
// state:   :state(overlay)
// parts:   scrim, sheet, handle, content
// vars:    --area-size, --area-expanded-size, --area-peek, --area-z, --area-border
//
// the area's own chrome (scrim, handle) lives in a shadow root, the children
// stay the author's and are projected, so a framework keeps rendering them.

import { AufbauElement } from '@aufbau/elements/core/index.js';

import { define, tagOf } from '../core/names.js';

// how far a drag has to go before it switches, in px
const DRAG_THRESHOLD = 64;

export class AppArea extends AufbauElement {

  static shadow = true;

  static attr = {
    breakpoint : { type: String, default: '48rem' },
    dock       : { type: String, default: 'none', values: ['bottom', 'end', 'none', 'start'] },
    expanded   : Boolean,
    name       : String,
    open       : Boolean,
    overlay    : { type: String, default: 'auto', values: ['always', 'auto', 'never'] },
    peek       : Boolean,
  };

  // the resolved dock and overlay on the host, so css selects the defaults as well
  static reflect = ['dock', 'overlay'];

  static styles () {
    return `
    :host {
      --area-border : var(--border, 1px solid color-mix(in oklab, currentColor 20%, transparent));
      --area-peek   : 1.75rem;
      --area-size   : min(20rem, 85vw);
      --area-z      : 100;

      box-sizing     : border-box;
      display        : flex;
      flex-direction : column;
      min-block-size : 0;
      min-inline-size: 0;
    }

    :host([hidden]) { display: none; }

    [part="scrim"]  { display: none; }
    [part="handle"] { display: none; }

    [part="content"] {
      display        : flex;
      flex           : 1 1 auto;
      flex-direction : column;
      min-block-size : 0;
      overflow       : auto;
    }

    /*//////////// MAIN ////////////*/

    :host([dock="none"]) {
      grid-area : main;
      position  : relative;

      [part="sheet"]   { display: contents; }
      [part="content"] { overflow: hidden; }
    }

    /* the active view fills the area and scrolls on its own, an inactive one is out of the flow (app-view) */
    ::slotted(${tagOf('app-view')}[active]) {
      flex           : 1 1 auto;
      min-block-size : 0;
      overflow       : auto;
    }

    /*//////////// DOCKED ////////////*/

    :host([dock="start"])  { grid-area: start;  }
    :host([dock="end"])    { grid-area: end;    }
    :host([dock="bottom"]) { grid-area: bottom; }

    :host(:not([dock="none"], [open], [peek])) { display: none; }

    [part="sheet"] {
      background-color : var(--color-bg);
      box-sizing       : border-box;
      display          : flex;
      flex-direction   : column;
      min-block-size   : 0;
      position         : relative;
    }

    :host([dock="start"]:not(:state(overlay))) [part="sheet"] { border-inline-end: var(--area-border); flex: 1 1 auto; inline-size: var(--area-size); }
    :host([dock="end"]:not(:state(overlay)))   [part="sheet"] { border-inline-start: var(--area-border); flex: 1 1 auto; inline-size: var(--area-size); }
    :host([dock="bottom"]:not(:state(overlay))) [part="sheet"] { border-block-start: var(--area-border); max-block-size: var(--area-size); }

    :host([dock="start"]:not(:state(overlay))[expanded]),
    :host([dock="end"]:not(:state(overlay))[expanded]) { --area-size: var(--area-expanded-size, 50vw); }

    :host([dock="bottom"]) { --area-size: 40dvh; }
    :host([dock="bottom"]:not(:state(overlay))[expanded]) { --area-size: var(--area-expanded-size, 70dvh); }

    /* a closed sheet with peek keeps its handle, docked as well */
    :host([dock="bottom"]:not([open])[peek]:not(:state(overlay))) [part="content"] { display: none; }

    /*//////////// OVERLAY ////////////*/

    :host(:state(overlay)) {
      inset          : 0;
      pointer-events : none;
      position       : fixed;
      z-index        : var(--area-z);
    }

    :host(:state(overlay)) [part="scrim"] {
      background-color : var(--area-scrim, rgb(0 0 0 / 0.45));
      display          : block;
      inset            : 0;
      opacity          : 0;
      position         : absolute;
      transition       : opacity 0.25s ease;
    }

    /* an open drawer lies above the closed ones, a peeking handle included */
    :host(:state(overlay)[open]) { z-index: calc(var(--area-z) + 1); }

    :host(:state(overlay)[open]) [part="scrim"] { opacity: 1; pointer-events: auto; }

    :host(:state(overlay)) [part="sheet"] {
      box-shadow     : 0 0 1.5rem rgb(0 0 0 / 0.25);
      pointer-events : auto;
      position       : absolute;
      transition     : translate 0.25s ease, inline-size 0.25s ease, block-size 0.25s ease;
    }

    :host(:state(dragging)) [part="sheet"] { transition: none; }

    :host(:state(overlay)[dock="start"]) [part="sheet"] { inset-block: 0; inset-inline-start: 0; inline-size: var(--area-size); translate: -100% 0; }
    :host(:state(overlay)[dock="end"])   [part="sheet"] { inset-block: 0; inset-inline-end: 0;   inline-size: var(--area-size); translate:  100% 0; }

    :host(:state(overlay)[dock="bottom"]) [part="sheet"] {
      border-start-end-radius   : var(--radius-surface, 1rem);
      border-start-start-radius : var(--radius-surface, 1rem);
      inset-block-end           : 0;
      inset-inline              : 0;
      max-block-size            : 85dvh;
      translate                 : 0 100%;
    }

    :host(:state(overlay)[dock="bottom"][peek]:not([open])) [part="sheet"] { translate: 0 calc(100% - var(--area-peek)); }

    :host(:state(overlay)[open]) [part="sheet"] { translate: 0 0; }

    :host(:state(overlay)[expanded]:not([dock="bottom"])) [part="sheet"] { inline-size: 100vw; }
    :host(:state(overlay)[expanded][dock="bottom"])       [part="sheet"] { block-size: 100dvh; border-radius: 0; max-block-size: 100dvh; }

    /*//////////// HANDLE ////////////*/

    :host(:state(overlay)) [part="handle"],
    :host([dock="bottom"][peek]) [part="handle"] {
      cursor       : grab;
      display      : block;
      flex         : none;
      position     : relative;
      touch-action : none;

      &::after {
        background-color : currentColor;
        border-radius    : 999px;
        content          : '';
        inset            : 50% auto auto 50%;
        opacity          : 0.35;
        position         : absolute;
        translate        : -50% -50%;
      }
    }

    :host([dock="bottom"]) [part="handle"] {
      block-size : var(--area-peek);
      &::after   { block-size: 0.25rem; inline-size: 2.5rem; }
    }

    /* a side drawer is pulled shut at its inner edge */
    :host(:state(overlay):not([dock="bottom"])) [part="handle"] {
      inline-size : 1rem;
      inset-block : 0;
      position    : absolute;
      z-index     : 1;
      &::after    { block-size: 2.5rem; inline-size: 0.25rem; }
    }

    :host(:state(overlay)[dock="start"]) [part="handle"] { inset-inline-end: 0; }
    :host(:state(overlay)[dock="end"])   [part="handle"] { inset-inline-start: 0; }

    @media (prefers-reduced-motion: reduce) {
      [part="scrim"], [part="sheet"] { transition: none !important; }
    }
    `;
  }

  render () {
    return `
      <div part="scrim"></div>
      <div part="sheet">
        <div part="handle" role="button" tabindex="-1" aria-label="toggle"></div>
        <div part="content"><slot></slot></div>
      </div>
    `;
  }

  get docked    () { return this.getAttr('dock') !== 'none'; }
  get isOverlay () { return this.states.has('overlay'); }

  /** the app-root this area belongs to, null outside of one. not `root`: that is the element's own tree */
  get appRoot () { return this.closest(tagOf('app-root')); }

  // :::::: API :::::::::::::::::::::::::::::::::::::::::::::::::

  show   () { return this.toggle(true); }
  hide   () { return this.toggle(false); }

  toggle (force = !this.open) {
    if (!this.docked || Boolean(force) === this.open) return this;
    if (force) this.closeOtherDrawers();
    this.toggleAttribute('open', Boolean(force));
    if (!force) this.toggleAttribute('expanded', false);
    return this;
  }

  expand (force = !this.expanded) {
    if (!this.docked) return this;
    if (force && !this.open) this.closeOtherDrawers();
    this.toggleAttribute('expanded', Boolean(force));
    if (force) this.toggleAttribute('open', true);
    return this;
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  onMount () {
    this.watchBreakpoint();

    this.on(this.shadowRoot, 'click', event => {
      if (event.target.matches?.('[part="scrim"]')) this.hide();
    });

    this.on(document, 'keydown', event => {
      if (event.key === 'Escape' && this.isOverlay && this.open && !event.defaultPrevented) this.hide();
    });

    this.on(this.shadowRoot, 'pointerdown', event => {
      if (event.target.matches?.('[part="handle"]')) this.drag(event);
    });
  }

  onUnmount () { this.setOthersInert(false); }

  onAttributeChange (name) {
    if (name === 'breakpoint' || name === 'dock' || name === 'overlay') this.watchBreakpoint();
  }

  sync () {
    const open = this.open;
    const content = this.shadowRoot.querySelector('[part="content"]');
    if (content) content.inert = this.docked && !open;

    // the toggle event fires on a change, not on the first pass
    const state = `${open}:${this.expanded}`;
    if (this._state != null && this._state !== state) this.emit('toggle', { expanded: this.expanded, open });
    this._state = state;

    this.setOthersInert(this.isOverlay && open);
  }

  // overlay is a matter of the viewport, unless the attribute decides it. the main area never is one
  watchBreakpoint () {
    this._media?.();
    const mode = this.getAttr('overlay');
    const set  = overlay => { this.states.toggle('overlay', overlay && this.docked); this.update(); };

    if (mode !== 'auto') { this._media = null; set(mode === 'always'); return; }

    const query  = globalThis.matchMedia?.(`(width < ${this.getAttr('breakpoint')})`);
    const change = () => set(Boolean(query?.matches));
    const stop   = () => query?.removeEventListener('change', change);
    query?.addEventListener('change', change);
    this.track(stop);
    this._media = stop;
    set(Boolean(query?.matches));
  }

  // one drawer at a time: each makes the rest of the root inert, two open ones
  // would leave nothing to touch. closed before this one opens, so their inert
  // is undone before this one sets its own
  closeOtherDrawers () {
    if (!this.isOverlay) return;
    for (const area of this.appRoot?.areas ?? []) if (area !== this && area.isOverlay && area.open) area.hide();
  }

  // while a drawer is open, the rest of the root is out of reach for focus and pointer
  setOthersInert (inert) {
    const root = this.appRoot;
    if (!root) return;

    if (inert && !this._inerted) {
      this._inerted = [...root.children].filter(element => element !== this && !element.inert);
      for (const element of this._inerted) element.inert = true;
    }
    else if (!inert && this._inerted) {
      for (const element of this._inerted) element.inert = false;
      this._inerted = null;
    }
  }

  // :::::: DRAG ::::::::::::::::::::::::::::::::::::::::::::::::

  /*
  the sheet follows the pointer along its axis, released it opens, closes or
  (bottom) expands by distance. a release without movement is a tap and toggles.
  only a drawer follows the pointer, a docked bottom sheet just switches. the
  sheet stays between closed and open: pulled further it would lift off its edge.
  */
  drag (start) {
    const sheet  = this.shadowRoot.querySelector('[part="sheet"]');
    const dock   = this.getAttr('dock');
    const axis   = dock === 'bottom' ? 'y' : 'x';
    const sign   = dock === 'start' ? -1 : 1;   // the direction that closes
    const handle = start.target;
    const origin = axis === 'y' ? start.clientY : start.clientX;
    let   delta  = 0;

    // the offset of the closed sheet in px: off screen, but for the handle of a peeking one
    const size   = axis === 'y' ? sheet.offsetHeight : sheet.offsetWidth;
    const peek   = dock === 'bottom' && this.getAttr('peek') ? handle.offsetHeight : 0;
    const closed = (size - peek) * sign;
    const from   = this.open ? 0 : closed;

    handle.setPointerCapture(start.pointerId);
    this.states.add('dragging');

    const move = event => {
      delta = (axis === 'y' ? event.clientY : event.clientX) - origin;
      if (!this.isOverlay) return;

      const offset = Math.min(Math.max(from + delta, Math.min(0, closed)), Math.max(0, closed));
      sheet.style.translate = axis === 'y' ? `0 ${offset}px` : `${offset}px 0`;
    };

    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      this.states.delete('dragging');
      sheet.style.translate = '';

      const towardsClose = delta * sign;
      if (Math.abs(delta) < 4)                         this.toggle();
      else if (towardsClose >  DRAG_THRESHOLD)         this.expanded ? this.expand(false) : this.hide();
      else if (towardsClose < -DRAG_THRESHOLD)         this.open && dock === 'bottom' ? this.expand(true) : this.show();
    };

    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }
}

// every attribute is a property too, written through to the attribute, so a
// framework setting open={false} removes it instead of leaving an expando
for (const name of Object.keys(AppArea.attr)) {
  Object.defineProperty(AppArea.prototype, name, {
    configurable : true,
    get () { return this.getAttr(name); },
    set (value) {
      if (value === false || value == null) this.removeAttribute(name);
      else this.setAttribute(name, value === true ? '' : String(value));
    },
  });
}

define('app-area', AppArea);

export default AppArea;
