import { debounce } from '@pulgasari/timing';

import { html }                                                             from '../../../lib/html.js';
import { GROUP, groupEvents, optionButtons, updateSelected, updateTabStop } from './parts/options.js';

const DEBOUNCE = 250;


const hasSearch = host => Boolean(host.valueType.list?.query || host.getAttr('searchable'));

function filter (host, query) {
  const needle = query.trim().toLowerCase();

  for (const item of host.part('options').$$('[data-value]')) {
    const label = (item.title || item.textContent).toLowerCase();
    item.hidden = Boolean(needle) && !label.includes(needle);
  }
}

export default {
  fits : shape => shape.kind === 'list' && shape.count !== 'range',

  css : `
    [part~="box"] { align-items: stretch; flex-direction: column; }

    [part~="search"] {
      border         : var(--input-line);
      border-radius  : --radius();
      min-block-size : --space(9);
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
      border-radius : --radius();
      font-size     : 1.25em;

      &:hover             { background: color-mix(in srgb, currentColor 10%, transparent); }
      &[part~="selected"] { background: var(--color-ink, AccentColor); color: var(--color-bg, Canvas); }
    }
  `,

  render (host) {
    const search = hasSearch(host) && html`<input type="search" part="search" placeholder="${host.placeholder || 'search…'}" />`;
    return html`${search}<div part="options"></div>`;
  },

  events (host, scope) {
    groupEvents(host, scope);

    const search = debounce(query => host.source.search(query), DEBOUNCE);
    host.track(search.cancel);

    scope.$(host.root).on('input', event => {
      if (event.target !== host.part('search').node) return;
      if (host.valueType.list?.query) search(event.target.value);
      else filter(host, event.target.value);
    });
  },

  update (host) {
    const container = host.part('options').node;

    // only new options rebuild the tiles
    const signature = host.options.map(entry => entry.value).join('\n');
    if (container.dataset.signature !== signature) {
      container.dataset.signature = signature;
      container.innerHTML = optionButtons(host, 'option', { iconsOnly: true });
      const search = host.part('search').node;
      if (search?.value && !host.valueType.list?.query) filter(host, search.value);
    }

    updateTabStop(host, updateSelected(host));
  },

  role  : GROUP.role,
  focus : host => host.part('search').node ?? host.root.querySelector('[data-value][tabindex="0"]'),
};
