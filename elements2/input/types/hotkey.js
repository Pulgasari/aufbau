import text from './text.js';

const MODIFIERS = ['Control', 'Alt', 'Shift', 'Meta'];
const NAMES     = { ' ': 'Space', Escape: 'Esc' };

function keyOf (event) {
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3);
  if (/^Digit\d$/.test(event.code))  return event.code.slice(5);
  const key = NAMES[event.key] ?? event.key;
  return key.length === 1 ? key.toUpperCase() : key;
}

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

export default {
  ...text,
  icon        : 'lucide:keyboard',
  placeholder : 'press a key…',

  setup (host, on) {
    // nothing is typed into the field, only recorded
    on(host.root, 'beforeinput', event => event.preventDefault(), { capture: true });

    on(host.root, 'keydown', event => {
      if (host.isLocked || event.target.localName !== 'input') return;
      if (event.key === 'Tab' && bare(event)) return;
      event.preventDefault();

      if ((event.key === 'Backspace' || event.key === 'Delete') && bare(event)) return host.setValue('');
      const hotkey = hotkeyOf(event);
      if (hotkey) host.setValue(hotkey);
    });
  },
};
