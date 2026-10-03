import { html }                                                     from '../../lib/html.js';
import { groupEvents, optionButtons, updateSelected, updateTabStop } from './parts/options.js';

const DEBOUNCE = 250;

const searchOf  = host => host.root.querySelector('[part~="search"]');
const optionsOf = host => host.root.querySelector('[part~="options"]');

const hasSearch = host => Boolean(host.valueType.list?.query || host.getAttr('searchable'));

function filter (host, query) {
  const needle = query.trim().toLowerCase();

  for (const item of optionsOf(host).querySelectorAll('[data-value]')) {
    const label = (item.title || item.textContent).toLowerCase();
    item.hidden = Boolean(needle) && !label.includes(needle);
  }
}

export default {
  fits : shape => shape.kind === 'list' && shape.count !== 'range',

  css : `
    [part~="box"] { align-items: stretch; flex-direction: column; }

    [part~="search"] {
      border         : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius  : var(--radius-control, 0.4em);
      min-block-size : var(--control-size, 2.25em);
      padding-inline : 0.6em;

      &:focus { border-color: var(--color-ink, Highlight); }
    }

    [part~="options"] {
      display               : grid;
      gap                   : 0.25em;
      grid-template-columns : repeat(auto-fill, minmax(var(--grid-size, 2.5em), 1fr));
      max-block-size        : var(--grid-height, 16em);
      overflow-y            : auto;
    }

    [part~="option"] {
      aspect-ratio  : 1;
      border-radius : var(--radius-control, 0.4em);
      font-size     : 1.25em;

      &:hover             { background: color-mix(in srgb, currentColor 10%, transparent); }
      &[part~="selected"] { background: var(--color-ink, AccentColor); color: var(--color-bg, Canvas); }
    }
  `,

  render (host) {
    const search = hasSearch(host) && html`<input type="search" part="search" placeholder="${host.placeholder || 'search…'}" />`;
    return html`${search}<div part="options"></div>`;
  },

  events (host, on) {
    groupEvents(host, on);

    let timer = null;
    host.track(() => clearTimeout(timer));

    on(host.root, 'input', event => {
      if (event.target !== searchOf(host)) return;
      const query = event.target.value;

      if (!host.valueType.list?.query) return filter(host, query);

      clearTimeout(timer);
      timer = setTimeout(() => host.source.search(query), DEBOUNCE);
    });
  },

  update (host) {
    const container = optionsOf(host);

    // only new options rebuild the tiles
    const signature = host.options.map(entry => entry.value).join('\n');
    if (container.dataset.signature !== signature) {
      container.dataset.signature = signature;
      container.innerHTML = optionButtons(host, 'option', { iconsOnly: true });
      const search = searchOf(host);
      if (search?.value && !host.valueType.list?.query) filter(host, search.value);
    }

    updateTabStop(host, updateSelected(host));
  },

  role  : host => host.count === 'multiple' ? 'group' : 'radiogroup',
  focus : host => searchOf(host) ?? host.root.querySelector('[data-value][tabindex="0"]'),
};
