import { attrs, html }                  from '../../../lib/html.js';
import { place }                        from '../../../lib/placement.js';
import { formatPattern, parsePattern }  from '../types/pattern.js';

const currentOf  = host => host.root.querySelector('[part~="current"]');
const popoverOf  = host => host.root.querySelector('[part~="patterns"]');
const sliderOf   = host => host.root.querySelector('[part~="opacity"]');
const colorOf    = (host, which) => host.root.querySelector(`[data-color="${which}"]`);
const swatchesOf = host => [...host.root.querySelectorAll('[part~="patterns"] [data-pattern]')];

const idOf = button => button.dataset.pattern === 'none' ? '' : button.dataset.pattern;

const swatch = (id, label, part = 'swatch') => html`
  <button type="button" part="${part}" data-pattern="${id}" ${attrs({ 'aria-label': label, title: label })}><span></span></button>
`;

function idsOf (host, catalog) {
  const known  = catalog.map(pattern => pattern.id);
  const wanted = host.getAttribute('patterns')?.trim();
  if (!wanted) return known;
  return wanted.split(/\s+/).filter(id => known.includes(id));
}

async function paint (host) {
  const { use } = await import('@aufbau/patterns');

  for (const span of host.root.querySelectorAll('[data-pattern] > span')) {
    const id = idOf(span.parentElement);
    if (!id || span.dataset.painted === id) continue;

    span.dataset.painted = id;
    use(id).image()
      .then(image => { if (idOf(span.parentElement) === id) span.style.setProperty('--swatch', image); })
      .catch(() => {});
  }
}

function pick (host, id) {
  const slider = sliderOf(host);
  const colors = host.hasAttribute('colors');

  host.setValue(formatPattern({
    bg      : colors ? colorOf(host, 'bg').value : null,
    fg      : colors ? colorOf(host, 'fg').value : null,
    id,
    opacity : slider ? Number(slider.value) / 100 : null,
  }));
}

function fill (host) {
  const popover = popoverOf(host);
  if (popover.dataset.filled) return;
  popover.dataset.filled = 'true';

  import('@aufbau/patterns').then(({ list }) => {
    const catalog  = list();
    const names    = Object.fromEntries(catalog.map(pattern => [pattern.id, pattern.name]));
    const swatches = idsOf(host, catalog).map(id => swatch(id, names[id] ?? id));
    const none     = !host.hasAttribute('required') && swatch('none', 'none');

    popover.innerHTML = html`${none}${swatches}`;
    host.update();
  });
}

function toggle (host, open) {
  const popover = popoverOf(host);
  if (open) {
    popover.showPopover();
    place(popover, currentOf(host));
    popover.querySelector('[tabindex="0"]')?.focus();
  }
  else popover.hidePopover();
}

export default {
  fits : shape => shape.type === 'pattern',

  css : `
    [part~="box"] { flex-wrap: wrap; }

    [part~="current"], [part~="swatch"] {
      aspect-ratio  : 1;
      border        : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius : var(--radius-control, 0.4em);
      inline-size   : var(--pattern-swatch-size, 2.75em);
      overflow      : hidden;
      position      : relative;

      > span {
        background-color : currentColor;
        inset            : 0;
        mask-image       : var(--swatch);
        opacity          : 0.7;
        position         : absolute;
      }

      &[data-pattern="none"] > span {
        background : linear-gradient(to top right, transparent calc(50% - 1px), currentColor 0 calc(50% + 1px), transparent 0);
        mask-image : none;
        opacity    : 0.4;
      }
    }

    [part~="swatch"][aria-checked="true"] { outline: 2px solid var(--color-ink, currentColor); outline-offset: 1px; }

    [part~="opacity"] { accent-color: var(--color-ink, AccentColor); flex: 1 1 8em; }

    [part~="colors"] { display: flex; gap: 0.5em; }

    [part~="color"] {
      block-size    : 2em;
      border        : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius : var(--radius-control, 0.4em);
      inline-size   : 2.5em;
      padding       : 0.15em;
    }

    [part~="patterns"] {
      background            : var(--color-bg, Canvas);
      border                : var(--border-width, 1px) solid color-mix(in srgb, currentColor 25%, transparent);
      border-radius         : var(--radius-control, 0.4em);
      color                 : inherit;
      gap                   : 0.375em;
      grid-template-columns : repeat(var(--pattern-columns, 5), var(--pattern-swatch-size, 2.75em));
      margin                : 0;
      padding               : 0.5em;
      position              : fixed;

      &:popover-open { display: grid; }
    }
  `,

  render (host) {
    const opacity = host.hasAttribute('opacity');
    const colors  = host.hasAttribute('colors');

    return html`
      ${swatch('none', 'pattern', 'current')}
      ${opacity && html`<input type="range" part="opacity" min="0" max="100" step="1" aria-label="opacity" />`}
      ${colors && html`
        <span part="colors">
          <input type="color" part="color" data-color="fg" aria-label="pattern color" />
          <input type="color" part="color" data-color="bg" aria-label="background color" />
        </span>`}
      <div part="patterns" popover="auto" role="radiogroup" aria-label="patterns"></div>
    `;
  },

  events (host, on) {
    on('click', '[part~="current"]', () => toggle(host, !popoverOf(host).matches(':popover-open')));

    // a click picks and closes, the arrows pick and stay
    on('click', '[part~="patterns"] [data-pattern]', (event, button) => {
      pick(host, idOf(button));
      toggle(host, false);
      currentOf(host).focus();
    });

    on(host.root, 'keydown', event => {
      const steps = { ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1 };
      const step  = steps[event.key];
      const items = swatchesOf(host);
      const index = items.indexOf(event.target);
      if (!step || index < 0) return;

      event.preventDefault();
      const next = items[(index + step + items.length) % items.length];
      next.focus();
      pick(host, idOf(next));
    });

    const keep = () => {
      const first = swatchesOf(host).map(idOf).find(Boolean) ?? '';
      pick(host, parsePattern(host.value).id || first);
    };
    on(host.root, 'change', event => { if (event.target.matches('[part~="opacity"], [part~="color"]')) keep(); });
  },

  update (host) {
    fill(host);
    const parts = parsePattern(host.value);

    const current = currentOf(host);
    current.dataset.pattern = parts.id || 'none';

    const slider = sliderOf(host);
    if (slider && slider !== host.focused) slider.value = String(Math.round((parts.opacity ?? 0.1) * 100));

    if (host.hasAttribute('colors')) {
      colorOf(host, 'fg').value = parts.fg ?? '#000000';
      colorOf(host, 'bg').value = parts.bg ?? '#ffffff';
    }

    const items   = swatchesOf(host);
    const checked = items.find(button => idOf(button) === parts.id) ?? items[0];
    for (const button of items) {
      button.setAttribute('aria-checked', String(idOf(button) === parts.id));
      button.tabIndex = button === checked ? 0 : -1;
    }
    current.title = checked?.title ?? '';

    paint(host);
  },

  focus : currentOf,
};
