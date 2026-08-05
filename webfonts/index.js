// @aufbau/webfonts/index.js

import aufbau, {
  html, render, signal, computed, useState, useEffect, useRef
} from '@aufbau/kits/preact-htm';
//import { importJSON5 } from '@aufbau/import';

await aufbau.init();

// :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::::

const MANIFEST = new URL('./fonts.json5', import.meta.url);

// pangram exercises umlauts and eszett - relevant for the german/blackletter part of the collection
const SPECIMEN_LINE  = 'Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich.';
const SPECIMEN_BLOCK = 'Der Buchdruck kam aus Mainz, die Schwabacher aus Nürnberg, und beide '
                     + 'überlebten fünfhundert Jahre Papier. 0123456789 – ÄÖÜ äöüß & @ %';

const CATEGORIES = ['all', 'fraktur', 'serif', 'sans', 'mono'];

// :::::: STATE :::::::::::::::::::::::::::::::::::::::::::::::::

const fonts    = signal([]);
const status   = signal('loading'); // loading | ready | error
const query    = signal('');
const category = signal('all');
const viewmode = signal('list');    // list | grid
const size     = signal(34);
const weight   = signal(400);

// :::::: DERIVED :::::::::::::::::::::::::::::::::::::::::::::::

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  const c = category.value;
  return fonts.value.filter(font =>
    (c === 'all' || font.category === c) &&
    (!q || font.name.toLowerCase().includes(q) || font.designer.toLowerCase().includes(q))
  );
});

// [['A', [...fonts]], ['B', [...]]] - sorted, locale aware
const groups = computed(() => {
  const map = new Map();
  for (const font of [...filtered.value].sort((a, b) => a.name.localeCompare(b.name, 'de'))) {
    const letter = font.name[0].toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter).push(font);
  }
  return [...map];
});

// :::::: FONT LOADING ::::::::::::::::::::::::::::::::::::::::::

const registry = new Map(); // font.id -> Promise, prevents duplicate FontFace registration

/**
 * loads every face of a font via the FontFace api and registers it on the document.
 * @param {object} font - manifest entry
 * @returns {Promise<void>}
 */
function loadFont (font) {
  if (registry.has(font.id)) return registry.get(font.id);

  const task = Promise.all(font.faces.map(async face => {
    //const url    = new URL(`./${face.file}`, MANIFEST).href;
    const data = await aufbau.import(MANIFEST.href);
    const loaded = await new FontFace(font.name, `url("${url}") format("woff2")`, {
      weight  : String(face.weight),
      style   : face.style,
      display : 'swap'
    }).load();
    document.fonts.add(loaded);
  })).catch(err => {
    console.warn(`[@aufbau/webfonts] could not load "${font.name}":`, err);
    throw err;
  });

  registry.set(font.id, task);
  return task;
}

// :::::: COMPONENTS ::::::::::::::::::::::::::::::::::::::::::::

/**
 * single specimen. the face is only fetched once the card is about to enter the viewport,
 * so a collection of 100+ fonts stays cheap on mobile.
 */
function Specimen ({ font }) {
  const ref = useRef(null);
  const [state, setState] = useState(registry.has(font.id) ? 'ready' : 'idle');

  useEffect(() => {
    if (state !== 'idle' || !ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setState('loading');
      loadFont(font).then(() => setState('ready'), () => setState('error'));
    }, { rootMargin: '300px' });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [font.id, state]);

  // weight is clamped to what the font actually offers, so the control never lies
  const available = font.faces.flatMap(face =>
    String(face.weight).includes(' ')
      ? String(face.weight).split(' ').map(Number)
      : [Number(face.weight)]
  );
  const min      = Math.min(...available);
  const max      = Math.max(...available);
  const rendered = Math.min(Math.max(weight.value, min), max);

  const style = {
    fontFamily : `"${font.name}", ${font.fallback}`,
    fontSize   : `${size.value}px`,
    fontWeight : rendered
  };

  return html`
    <aufbau-item ref=${ref} class="specimen" data-state=${state}>
      <header>
        <h3>${font.name}</h3>
        <p>
          <span class="cat">${font.category}</span>
          <span class="designer">${font.designer}</span>
          <span class="license" title=${font.commercial ? 'commercial use allowed' : 'private use only'}>
            ${font.license}
          </span>
        </p>
      </header>
      <p class="preview" style=${style}>
        ${viewmode.value === 'list' ? SPECIMEN_LINE : SPECIMEN_BLOCK}
      </p>
      ${state === 'error' && html`<p class="hint">Datei fehlt: ${font.faces[0].file}</p>`}
    </aufbau-item>
  `;
}

/** a-z jumplist. only letters that actually have matches are shown. */
function Letterbar () {
  return html`
    <nav class="letterbar" aria-label="Alphabet">
      ${groups.value.map(([letter]) => html`
        <a key=${letter} href=${`#letter-${letter}`}>${letter}</a>
      `)}
    </nav>
  `;
}

function Toolbar () {
  return html`
    <div class="toolbar">
      <input
        type="search"
        class="search"
        placeholder="Schrift oder Gestalter suchen"
        value=${query.value}
        onInput=${event => query.value = event.target.value} />

      <div class="chips" role="group" aria-label="Kategorie">
        ${CATEGORIES.map(cat => html`
          <button
            key=${cat}
            aria-pressed=${category.value === cat}
            onClick=${() => category.value = cat}>${cat}</button>
        `)}
      </div>

      <div class="controls">
        <label>
          <span>Größe</span>
          <input type="range" min="12" max="120" value=${size.value}
            onInput=${event => size.value = +event.target.value} />
          <output>${size.value}px</output>
        </label>
        <label>
          <span>Schnitt</span>
          <input type="range" min="100" max="900" step="100" value=${weight.value}
            onInput=${event => weight.value = +event.target.value} />
          <output>${weight.value}</output>
        </label>
        <div class="chips" role="group" aria-label="Ansicht">
          <button aria-pressed=${viewmode.value === 'list'} onClick=${() => viewmode.value = 'list'}>Liste</button>
          <button aria-pressed=${viewmode.value === 'grid'} onClick=${() => viewmode.value = 'grid'}>Raster</button>
        </div>
      </div>
    </div>
  `;
}

function App () {
  if (status.value === 'loading') return html`<p class="state">Sammlung wird geladen…</p>`;
  if (status.value === 'error')   return html`<p class="state">fonts.json5 ist nicht erreichbar.</p>`;

  return html`
    <header class="masthead">
      <h1>@aufbau/webfonts</h1>
      <p>${filtered.value.length} von ${fonts.value.length} Schriften</p>
    </header>

    ${Toolbar()}
    ${Letterbar()}

    <main data-viewmode=${viewmode.value}>
      ${groups.value.length === 0
        ? html`<p class="state">Keine Treffer. Suche oder Kategorie zurücksetzen.</p>`
        : groups.value.map(([letter, list]) => html`
            <section key=${letter}>
              <h2 id=${`letter-${letter}`}>${letter}</h2>
              <aufbau-index viewmode=${viewmode.value} item-size="320px" gap="1rem">
                ${list.map(font => html`<${Specimen} key=${font.id} font=${font} />`)}
              </aufbau-index>
            </section>
          `)}
    </main>
  `;
}

// :::::: BOOT ::::::::::::::::::::::::::::::::::::::::::::::::::

try {
  const data = await aufbau.import(MANIFEST.href);
  fonts.value  = data.fonts ?? [];
  status.value = 'ready';
} catch (err) {
  console.error('[@aufbau/webfonts] manifest failed:', err);
  status.value = 'error';
}

render(html`<${App} />`, document.querySelector('#app'));
