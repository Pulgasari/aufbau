import { html } from './html.js';

export const ACTIONS = ['copy', 'paste', 'clear', 'reveal'];

const ICONS = {
  clear  : 'lucide:eraser',
  copy   : 'lucide:copy',
  done   : 'lucide:check',
  fail   : 'lucide:x',
  paste  : 'lucide:clipboard-paste',
  reveal : 'lucide:eye',
  veil   : 'lucide:eye-off',
};

export const parseActions = (tokens) => {
  const wanted = new Set(String(tokens ?? '').split(/[\s,]+/));
  return ACTIONS.filter(action => wanted.has(action));
};

export const actionButtons = (actions) => html`${actions.map(action => html`
  <button type="button" part="action ${action}" data-action="${action}" aria-label="${action}" title="${action}">
    <svg-icon icon="${ICONS[action]}"></svg-icon>
  </button>
`)}`;

const flash = (button, ok) => {
  const icon = button.querySelector('svg-icon');
  if (!icon) return;
  icon.setAttribute('icon', ok ? ICONS.done : ICONS.fail);
  clearTimeout(button._flash);
  button._flash = setTimeout(() => icon.setAttribute('icon', ICONS[button.dataset.action]), 1500);
};

const selectAll = (node) => {
  if ('select' in node) return node.select();
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

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

  // a password field shows its text while the button is on
  reveal (host, button) {
    const node = host.revealTarget?.() ?? host.actionTarget();
    if (!node || !('type' in node)) return;
    const shown = node.type === 'password';
    node.type = shown ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(shown));
    button.querySelector('svg-icon')?.setAttribute('icon', shown ? ICONS.veil : ICONS.reveal);
  },
};

export function bindActions (host, on = (...args) => host.on(...args)) {
  on('pointerdown', '[data-action]', (event) => event.preventDefault());
  on('click',       '[data-action]', (event, button) => runAction[button.dataset.action]?.(host, button));
}
