// <input-hotkey>
// a key combination, recorded by pressing it: 'Ctrl+Shift+K'. modifiers come
// first, in the order Ctrl, Alt, Shift, Meta. backspace or delete on their own
// clear it, tab on its own moves on as usual.
//
//   <input-hotkey name="save" value="Ctrl+S"></input-hotkey>

import { InputComponent } from '../core/InputComponent.js';

const MODIFIERS = ['Control', 'Alt', 'Shift', 'Meta'];
const NAMES     = { ' ': 'Space', Escape: 'Esc' };

/** the key of an event, independent of the keyboard layout for letters and digits */
function keyOf (event) {
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3);
  if (/^Digit\d$/.test(event.code))  return event.code.slice(5);
  const key = NAMES[event.key] ?? event.key;
  return key.length === 1 ? key.toUpperCase() : key;
}

/** 'Ctrl+Shift+K' from a keydown, null for a modifier pressed on its own */
export function hotkeyOf (event) {
  if (MODIFIERS.includes(event.key)) return null;
  return [
    event.ctrlKey  && 'Ctrl',
    event.altKey   && 'Alt',
    event.shiftKey && 'Shift',
    event.metaKey  && 'Meta',
    keyOf(event),
  ].filter(Boolean).join('+');
}

const bare = event => !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey;

export class InputHotkey extends InputComponent {

  static attr = {
    placeholder : 'press a key…',
  };

  bind () {
    const control = this.control;

    // nothing is typed into the field, only recorded
    this.on(control, 'beforeinput', event => event.preventDefault());

    this.on(control, 'keydown', event => {
      if (control.isDisabled || control.getAttr?.('readonly')) return;
      if (event.key === 'Tab' && bare(event)) return;

      event.preventDefault();

      if ((event.key === 'Backspace' || event.key === 'Delete') && bare(event)) return control.commit('');

      const hotkey = hotkeyOf(event);
      if (hotkey) control.commit(hotkey);
    });
  }
}

InputHotkey.init('input-hotkey');

export default InputHotkey;
