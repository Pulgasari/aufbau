// @aufbau/elements/core/actions.js
// copy / paste / clear buttons for text holding elements (<aufbau-code>, <aufbau-writer>).
//
// the host picks the set with an `actions` token list and implements nothing
// but where the text lives: actionTarget() returns the editable node. edits go
// through execCommand on purpose, deprecated or not it is the only way that
// keeps the native undo stack and fires a real input event, so the host's own
// input handling picks the change up as if it was typed.

import { html } from './html.js';

export const ACTIONS = ['copy', 'paste', 'clear'];

const ICONS = {
  clear : 'lucide:eraser',
  copy  : 'lucide:copy',
  done  : 'lucide:check',
  fail  : 'lucide:x',
  paste : 'lucide:clipboard-paste',
};

/** 'copy paste' -> ['copy', 'paste'], unknown tokens dropped, order kept canonical */
export const parseActions = (tokens) => {
  const wanted = new Set(String(tokens ?? '').split(/[\s,]+/));
  return ACTIONS.filter(action => wanted.has(action));
};

export const actionButtons = (actions) => html`${actions.map(action => html`
  <button type="button" data-action="${action}" aria-label="${action}" title="${action}">
    <aufbau-icon icon="${ICONS[action]}"></aufbau-icon>
  </button>
`)}`;

// brief confirmation on the button itself, then back to its own icon
const flash = (button, ok) => {
  const icon = button.querySelector('aufbau-icon');
  if (!icon) return;
  icon.setAttribute('icon', ok ? ICONS.done : ICONS.fail);
  clearTimeout(button._flash);
  button._flash = setTimeout(() => icon.setAttribute('icon', ICONS[button.dataset.action]), 1500);
};

// the whole content of a textarea/input or a contenteditable node
const selectAll = (node) => {
  if ('select' in node) return node.select();
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

// where execCommand is gone: same edit by hand, plus the input event it would have fired
const fallback = (node, text) => {
  if ('setRangeText' in node) node.setRangeText(text, node.selectionStart, node.selectionEnd, 'end');
  else {
    const range = getSelection().getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
  }
  node.dispatchEvent(new Event('input', { bubbles: true }));
};

// focus is kept in the field while a button is pressed, see bindActions. for a
// contenteditable without a caret inside, the text goes to the end
const insert = (node, text) => {
  node.focus();

  if (!('setRangeText' in node)) {
    const selection = getSelection();
    if (!node.contains(selection.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  if (!document.execCommand('insertText', false, text)) fallback(node, text);
};

export const runAction = {
  async copy (host, button) {
    try   { await navigator.clipboard.writeText(host.actionText()); flash(button, true); host.emit('aufbau-copy', { text: host.actionText() }); }
    catch (error) { flash(button, false); console.warn(`[${host.localName}] copy failed:`, error); }
  },

  async paste (host, button) {
    const node = host.actionTarget();
    if (!node) return;
    try   { insert(node, await navigator.clipboard.readText()); flash(button, true); }
    catch (error) { flash(button, false); console.warn(`[${host.localName}] paste failed:`, error); }
  },

  clear (host) {
    const node = host.actionTarget();
    if (!node) return;
    node.focus();
    selectAll(node);
    if (!document.execCommand('delete')) fallback(node, '');
  },
};

/**
 * wires the buttons of a host. the host provides:
 *   actionText ()    the text copy puts on the clipboard
 *   actionTarget ()  the editable node paste and clear work on, null when read only
 */
export function bindActions (host) {
  // pressing a button must not steal focus, the caret position is where paste lands
  host.on('pointerdown', '[data-action]', (event) => event.preventDefault());
  host.on('click',       '[data-action]', (event, button) => runAction[button.dataset.action]?.(host, button));
}
