import { html }                                                        from '../../../lib/html.js';
import { labelOf, updateSelected }                                     from './parts/options.js';
import { LISTBOX, isOpen, listbox, popoverEvents, setOpen, triggerOf } from './parts/popover.js';

const LONG_PRESS = 500;

export default {
  fits : shape => shape.kind === 'list' && shape.count === 'single',

  css : `
    ${LISTBOX}

    [part~="button"] {
      -webkit-touch-callout : none;
      border                : var(--input-line);
      border-radius         : --radius();
      min-block-size        : --space(9);
      padding-inline        : 0.75em;
      user-select           : none;
    }
  `,

  render : host => html`
    <button type="button" part="button" aria-haspopup="listbox" aria-expanded="false">
      <svg-icon part="icon" hidden></svg-icon>
      <span part="label"></span>
    </button>
    ${listbox(host)}
  `,

  events (host, scope) {
    const button = () => triggerOf(host);
    popoverEvents(host, scope, button);

    let timer   = null;
    let pressed = false;

    scope.on('pointerdown', '[aria-haspopup]', event => {
      if (event.button !== 0) return;
      pressed = false;
      clearTimeout(timer);
      timer = setTimeout(() => { pressed = true; setOpen(host, true, button()); }, LONG_PRESS);
    });

    const release = () => { clearTimeout(timer); if (pressed) setTimeout(() => { pressed = false; }); };
    scope.$(window).on('pointerup pointercancel', release);

    scope.on('click', '[aria-haspopup]', () => {
      if (pressed) return;
      if (isOpen(host)) setOpen(host, false, button());
      else host.cycle(1);
    });

    scope.on('contextmenu', '[aria-haspopup]', event => {
      event.preventDefault();
      setOpen(host, true, button());
    });
  },

  update (host) {
    updateSelected(host);

    const button  = triggerOf(host);
    const current = host.options.find(entry => entry.value === host.value);
    const name    = current ? labelOf(current) : (host.placeholder || 'select…');
    const icon    = button.querySelector('svg-icon');
    const label   = button.querySelector('[part~="label"]');

    icon.hidden = !current?.icon;
    if (current?.icon) icon.setAttribute('icon', current.icon);
    label.textContent = name;
    label.hidden      = Boolean(host.getAttr('iconsOnly') && current?.icon);
    button.title      = name;
    button.setAttribute('aria-label', name);
  },

  focus : triggerOf,
};
