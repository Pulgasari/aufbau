import { AufbauElement } from '@aufbau/element';

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

    :host([dock="none"]) {
      grid-area : main;
      position  : relative;

      [part="sheet"]   { display: contents; }
      [part="content"] { overflow: hidden; }
    }

    ::slotted(app-view[active]) {
      flex           : 1 1 auto;
      min-block-size : 0;
      overflow       : auto;
    }

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

    :host([dock="bottom"]:not([open])[peek]:not(:state(overlay))) [part="content"] { display: none; }

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

  get appRoot () { return this.closest('app-root'); }

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

  onConnected () {
    this.watchBreakpoint();

    this.part('scrim').onClick(() => this.hide());
    this.parts('handle').onPointerDown(event => this.drag(event));

    this.$(document).onKeyDown(event => {
      if (event.key === 'Escape' && this.isOverlay && this.open && !event.defaultPrevented) this.hide();
    });
  }

  onDisconnected () { this.setOthersInert(false); }

  onAttributeChanged (name) {
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

  closeOtherDrawers () {
    if (!this.isOverlay) return;
    for (const area of this.appRoot?.areas ?? []) if (area !== this && area.isOverlay && area.open) area.hide();
  }

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

  drag (start) {
    const sheet  = this.shadowRoot.querySelector('[part="sheet"]');
    const dock   = this.getAttr('dock');
    const axis   = dock === 'bottom' ? 'y' : 'x';
    const sign   = dock === 'start' ? -1 : 1;   // the direction that closes
    const handle = start.target;
    const origin = axis === 'y' ? start.clientY : start.clientX;
    let   delta  = 0;

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

AppArea.init('app-area');

export default AppArea;
