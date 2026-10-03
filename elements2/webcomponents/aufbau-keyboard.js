// <aufbau-keyboard>

// :::::: IMPORTS

import { observe }       from '@domina/observer';

import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// :::::: LAYOUTS

const GAP = ' ';

const LAYOUTS = {
  de : {
    regular : ['qwertzuiopü', 'asdfghjklöä', ' yxcvbnm '],
    shift   : ['QWERTZUIOPÜ', 'ASDFGHJKLÖÄ', ' YXCVBNM '],
    symbols : [`([{<?.,'$#=+*12345`, `)]}>!:;"&|_-/67890`],
  },
  en : {
    regular : ['qwertyuiop', 'asdfghjkl', ' zxcvbnm '],
    shift   : ['QWERTYUIOP', 'ASDFGHJKL', ' ZXCVBNM '],
    symbols : [`([{<?.,'$#=+*12345`, `)]}>!:;"&|_-/67890`],
  },
};

// :::::: KEYS

const SPECIALS = {
  alt       : { toggle : 'alt'   },
  ctrl      : { toggle : 'ctrl'  },
  capslock  : { icon : 'capslock',    toggle : 'caps'  },
  shift     : { icon : 'shift',       toggle : 'shift' },

  backspace : { icon : 'backspace',   key : 'Backspace',  code :  8 },
  enter     : { icon : 'enter',       key : 'Enter',      code : 13 },
  space     : { icon : 'space',       key : ' ',          code : 32 },
  tab       : { icon : 'tab',         key : 'Tab',        code :  9 },
  'tab-rtl' : { icon : 'tab-rtl',     key : 'Tab',        code :  9, shift : true },

  down      : { icon : 'arrow-down',  key : 'ArrowDown',  code : 40 },
  left      : { icon : 'arrow-left',  key : 'ArrowLeft',  code : 37 },
  right     : { icon : 'arrow-right', key : 'ArrowRight', code : 39 },
  up        : { icon : 'arrow-up',    key : 'ArrowUp',    code : 38 },
};

const EDGES  = [['tab', 'tab-rtl'], ['capslock', 'backspace'], ['shift', 'enter']];
const BOTTOM = ['ctrl', 'alt', 'space', 'up', 'down', 'left', 'right'];
const STICKY = ['shift', 'ctrl', 'alt'];

// :::::: NATIVE KEYBOARD

const FIELDS = 'input, textarea, [contenteditable]';

let suppressing = 0;
let unwatch     = null;

const onFocusIn = () => navigator.virtualKeyboard?.hide();

// every field, also the ones added later. unwatch() restores them
function setManual (field) {
  field.setAttribute('virtualkeyboardpolicy', 'manual');
  return () => field.removeAttribute('virtualkeyboardpolicy');
}

function suppressNative () {
  if (!navigator.virtualKeyboard || suppressing++) return;

  navigator.virtualKeyboard.overlaysContent = true;
  unwatch = observe(FIELDS, { onMatch: setManual });
  document.addEventListener('focusin', onFocusIn, true);
}

function restoreNative () {
  if (!navigator.virtualKeyboard || !suppressing || --suppressing) return;

  navigator.virtualKeyboard.overlaysContent = false;
  unwatch?.();
  unwatch = null;
  document.removeEventListener('focusin', onFocusIn, true);
}

// :::::: MAIN

export default class AufbauKeyboard extends AufbauElement {
  static layouts = LAYOUTS;

  static attr = {
    layout : { type: String, default: 'de', values: Object.keys(LAYOUTS) },

    rows   : { type: String, default: 'symbols keys' },

    target : String,

    'native-keyboard' : { type: String, default: 'hide', values: ['hide', 'keep'] },

    alt   : Boolean,
    caps  : Boolean,
    ctrl  : Boolean,
    shift : Boolean,
  };

  static styles = `aufbau-keyboard {
    background          : var(--keyboard-bg, var(--color-bg, Canvas));
    display             : flex;
    flex-direction      : column;
    gap                 : var(--keyboard-gap, 0.25rem);
    touch-action        : manipulation;
    user-select         : none;
    -webkit-user-select : none;

    > div {
      display        : flex;
      flex-direction : column;
      gap            : var(--keyboard-gap, 0.25rem);

      > div {
        display         : flex;
        gap             : var(--keyboard-gap, 0.25rem);
        justify-content : center;

        > span { flex: 1 0 0; }
      }
    }

    button {
      background    : var(--keyboard-key-bg, color-mix(in oklch, var(--color-bg, Canvas), var(--color-fg, CanvasText) 12%));
      border        : 0;
      border-radius : var(--keyboard-key-radius, 4px);
      color         : var(--keyboard-key-fg, var(--color-fg, CanvasText));
      cursor        : pointer;
      display       : grid;
      flex          : 1 0 0;
      font          : inherit;
      margin        : 0;
      padding       : var(--keyboard-key-padding, 0.5rem 0);
      place-content : center;

      &[aria-pressed="true"] {
        background : var(--keyboard-key-active-bg, var(--color-ink, Highlight));
        color      : var(--keyboard-key-active-fg, var(--accent-fg, HighlightText));
      }

      &:disabled { cursor: not-allowed; opacity: 0.25; }
    }

    [aria-label="symbols"] button { aspect-ratio: 1; border-radius: 50%; padding: 0; }

    :is([data-key="alt"], [data-key="backspace"], [data-key="capslock"], [data-key="ctrl"],
        [data-key="enter"], [data-key="shift"], [data-key="tab"], [data-key="tab-rtl"]) { flex-grow: 2; }

    [data-key="space"] { flex-grow: 7; }
  }`;

  // :::::: STATE

  get layout    () { return AufbauKeyboard.layouts[this.getAttr('layout')] ?? AufbauKeyboard.layouts.de; }         
  get isShifted () { return this.getAttr('shift') || this.getAttr('caps'); }

  get target () {
    const selector = this.getAttr('target');
    if (selector) return document.querySelector(selector);
    const active = document.activeElement;
    return active && active !== document.body ? active : null;
  }

  toggle (name, force) {
    this.setAttr({ [name]: force ?? !this.getAttr(name) });
    if (name === 'caps' && this.getAttr('caps')) this.setAttr({ shift: false });
    return this;
  }

  consume () {
    for (const name of STICKY) if (this.getAttr(name)) this.setAttr({ [name]: false });
    return this;
  }

  // :::::: TYPING

  // press a key by name: `a`, `shift`, `backspace` …
  press (name) {
    const special = SPECIALS[name];
    if (special?.toggle) return this.toggle(special.toggle);
    if (special)         return this.send(special.key, special);
    return this.send(this.isShifted ? name.toUpperCase() : name);
  }

  send (key, { code, shift } = {}) {
    const init = {
      key,
      keyCode    : code,
      which      : code,
      shiftKey   : shift ?? this.isShifted,
      ctrlKey    : this.getAttr('ctrl'),
      altKey     : this.getAttr('alt'),
      bubbles    : true,
      cancelable : true,
      composed   : true,
    };

    const target = this.target;

    this.emit('aufbau-keyboard-key', {
      key, target, shiftKey: init.shiftKey, ctrlKey: init.ctrlKey, altKey: init.altKey,
    });

    if (target) {
      const untouched = target.dispatchEvent(new KeyboardEvent('keydown', init));
      if (untouched) this.edit(target, key, init);
      target.dispatchEvent(new KeyboardEvent('keyup', init));
    }

    return this.consume();
  }

  edit (field, key, { ctrlKey, altKey } = {}) {
    const type = field.localName;
    if (type !== 'input' && type !== 'textarea') return this;
    if (ctrlKey || altKey) return this;

    const value = field.value ?? '';
    const start = field.selectionStart ?? value.length;
    const end   = field.selectionEnd   ?? start;

    const splice = (text, from = start, to = end) => {
      field.value = value.slice(0, from) + text + value.slice(to);
      caret(from + text.length);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const caret = (at) => { try { field.setSelectionRange(at, at); } catch {} };

    switch (key) {
      case 'Backspace'  :
        if (end > start) return splice('');
        if (start > 0)   return splice('', start - 1, start);
        return this;
      case 'ArrowLeft'  : caret(Math.max(0, (end > start ? start : start - 1))); return this;
      case 'ArrowRight' : caret(Math.min(value.length, end > start ? end : end + 1)); return this;
      case 'ArrowUp'    :
      case 'ArrowDown'  : return this;
      case 'Enter'      : if (type === 'textarea') splice('\n'); return this;
      case 'Tab'        : splice('\t'); return this;
    }

    if (key.length === 1) splice(key);
    return this;
  }

  // :::::: LIFECYCLE

  onConnected () {
    this.on('pointerdown', 'button[data-key]', (event, button) => {
      event.preventDefault();
      if (!button.disabled) this.press(button.dataset.key);
    });

    if (this.getAttr('nativeKeyboard') === 'hide') { suppressNative(); this._suppressing = true; }
  }

  onDisconnected () {
    if (this._suppressing) { restoreNative(); this._suppressing = false; }
  }

  onAttributeChanged (name) {
    if (name !== 'native-keyboard') return;
    const wanted = this.getAttr('nativeKeyboard') === 'hide';
    if (wanted === !!this._suppressing) return;
    wanted ? suppressNative() : restoreNative();
    this._suppressing = wanted;
  }

  // :::::: RENDER

  key (name, { label } = {}) {
    const special = SPECIALS[name];
    const icon    = special?.icon;
    const pressed = special?.toggle ? this.getAttr(special.toggle) : null;

    return html`<button type="button" tabindex="-1" ${attrs({
      'aria-label'   : icon ? name : false,
      'aria-pressed' : pressed == null ? false : String(Boolean(pressed)),
      'data-key'     : name,
    })}>${icon ? html`<svg-icon icon="${icon}"></svg-icon>` : (label ?? name)}</button>`;
  }

  row (chars, { edges = null } = {}) {
    const keys = [...chars].map(char => char === GAP ? html`<span></span>` : this.key(char));

    return html`
      <div>
        ${edges?.[0] && this.key(edges[0])}
        ${keys}
        ${edges?.[1] && this.key(edges[1])}
      </div>`;
  }

  render () {
    const layout = this.layout;
    const alpha  = this.isShifted ? layout.shift : layout.regular;

    const blocks = {
      symbols : html`<div role="group" aria-label="symbols">
        ${layout.symbols.map(row => this.row(row))}
      </div>`,

      keys : html`<div role="group" aria-label="keys">
        ${alpha.map((row, index) => this.row(row, { edges: EDGES[index] }))}
        <div>${BOTTOM.map(name => this.key(name))}</div>
      </div>`,
    };

    return html`${this.getAttr('rows').split(/\s+/).map(name => blocks[name] ?? '')}`;
  }
}

AufbauKeyboard.init();
