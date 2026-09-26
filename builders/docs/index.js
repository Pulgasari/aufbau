// @aufbau/builders/docs/index.js
// a docs site from markdown files: a hash router over the files, a sidebar, a
// table of contents and the theme controls. aufbau.boot() brings reset, theme,
// skin, elements and webfonts, index.ass the shell around them.
//
//   createDocsFW({ index: '$repo/readme.md', sidebar: { … }, vars: { repo: '../' } });

import initDefaultStylesheet from './ss.js';
import AufbauCode            from '@aufbau/elements/AufbauCode.js';   // for its static themes()
import aufbau                from '@aufbau/api';
import importFile            from '@aufbau/import';
import { effect, signal, typedSignal } from '@aufbau/signals';
import { isArray, isFn, isString }     from '@pulgasari/is';
import { toSlugCase }        from '@pulgasari/str';
import htm                   from 'htm';
import { h, render }         from 'preact';

const html = htm.bind(h);

const DEFAULT_CODE  = 'github-dark';
const DEFAULT_THEME = 'zombie';

const isExternal = href => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');

// :::::: PATHS :::::::::::::::::::::::::::::::::::::::::::::::::

/** replaces $name and ${name} with their vars, nested vars included */
export function resolvePath (pathStr, vars = {}) {
  if (!pathStr || !isString(pathStr)) return pathStr;

  let resolved  = pathStr;
  let maxPasses = 10; // circular vars must not loop forever

  while (maxPasses-- > 0) {
    let replaced = false;
    resolved = resolved.replace(/\$(\{([a-zA-Z0-9_]+)\}|([a-zA-Z0-9_]+))/g, (match, _, braced, unbraced) => {
      const name = braced || unbraced;
      if (!Object.hasOwn(vars, name)) return match;
      replaced = true;
      return vars[name];
    });
    if (!replaced) break;
  }

  // duplicate slashes, protocols like http:// excepted
  return resolved.replace(/(?<!:)\/{2,}/g, '/');
}

const toImportPath = path => /^(\.|\/|https?:)/.test(path) ? path : `./${path}`;

/** a file as text, or null. markdown comes back as html, svg as markup */
async function importText (raw, vars, label) {
  const resolved = resolvePath(raw, vars);
  try {
    const imported = await importFile(toImportPath(resolved));
    return isString(imported) ? imported : null;
  } catch (error) {
    console.warn(`[DocsFW] failed to load ${label} from "${resolved}":`, error);
    return null;
  }
}

// a folder link means its readme, the way github shows one. resolves [html, file]
async function importMarkdown (path) {
  const files = path.endsWith('/') ? [`${path}README.md`, `${path}readme.md`] : [path];
  let failure;
  for (const file of files) {
    try   { return [await importFile(toImportPath(file)), file]; }
    catch (error) { failure = error; }
  }
  throw failure;
}

export function parseHash (defaultPath = 'readme.md') {
  const raw = location.hash.replace(/^#\/?/, '');
  if (!raw) return { path: defaultPath, anchor: null };

  const [path, anchor] = raw.split('#');
  return { path: path.replace(/^\//, '') || defaultPath, anchor: anchor || null };
}

// :::::: CONFIG :::::::::::::::::::::::::::::::::::::::::::::::::

async function resolveBrand (brand, title, vars = {}) {
  if (isString(brand)) return { title: brand, img: null, svg: null };

  const svgSource = brand?.svg?.trim();
  const svg       = !svgSource                 ? null
                  : svgSource.startsWith('<svg') ? svgSource
                  : await importText(svgSource, vars, 'brand svg');

  return {
    title : brand?.title || title,
    img   : brand?.img ? resolvePath(brand.img, vars) : null,
    svg,
  };
}

function normalizeSidebar (sidebar) {
  if (isArray(sidebar)) return sidebar;
  if (sidebar && typeof sidebar === 'object') return Object.entries(sidebar).map(([title, path]) => ({ title, path }));
  return [];
}

// a component, inline html, or a path to an html file
async function resolveExtension (extension, vars = {}) {
  if (!extension)      return null;
  if (isFn(extension)) return { type: 'component', value: extension };
  if (!isString(extension)) return null;

  const trimmed = extension.trim();
  if (trimmed.startsWith('<') || trimmed.includes('\n')) return { type: 'html', value: trimmed };

  const value = await importText(trimmed, vars, 'extension');
  return value == null ? null : { type: 'html', value };
}

// :::::: CONTENT :::::::::::::::::::::::::::::::::::::::::::::::

const ASSET_ELEMENTS   = 'img[src], source[src], video[src], video[poster], audio[src]';
const ASSET_ATTRIBUTES = ['src', 'poster'];

/*
  markdown resolves against the file it came from, the rendered html against the page
  showing it, and here those are two different directories. an asset url is therefore
  rebased onto the markdown file itself, and a leading slash onto the repo root, which
  is what the same path means when github renders the file.

  hrefs are deliberately left alone: onContentClick routes every non-absolute one
  through the hash router, and an absolutised link would count as external there.
*/
function rebaseAssets (doc, docURL, rootURL) {
  for (const element of doc.querySelectorAll(ASSET_ELEMENTS)) {
    for (const attribute of ASSET_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (!value || value.startsWith('#') || isExternal(value)) continue;

      element.setAttribute(attribute, value.startsWith('/')
        ? new URL(value.replace(/^\/+/, ''), rootURL).href
        : new URL(value, docURL).href);
    }
  }
}

// fenced code blocks become <aufbau-code>, so highlighting and copy come from the element.
// doc.createElement on purpose: the live document would upgrade an element that
// never lives there
function upgradeCodeBlocks (doc) {
  for (const code of doc.querySelectorAll('pre > code')) {
    const element = doc.createElement('aufbau-code');
    element.setAttribute('lang', [...code.classList].find(name => name.startsWith('language-'))?.slice(9) || 'plaintext');
    element.textContent = code.textContent;
    code.parentElement.replaceWith(element);
  }
}

/** the rendered markdown with heading ids, rebased assets and upgraded code blocks */
export function processContent (htmlContent, { docURL, rootURL } = {}) {
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index) => {
    heading.id ||= toSlugCase(heading.textContent || '') || `heading-${index}`;
  });
  if (docURL) rebaseAssets(doc, docURL, rootURL ?? docURL);
  upgradeCodeBlocks(doc);
  return doc.body.innerHTML;
}

// :::::: MAIN ::::::::::::::::::::::::::::::::::::::::::::::::::

export function createDocsFW (config = {}) {
  const {
    after   = null,
    before  = null,
    brand   = null,
    index   = 'readme.md',
    root    = null,   // what a leading slash in markdown points at, see rootURL below
    sidebar = [],
    sw      = false,
    target  = '#app',
    title   = 'Documentation',
    toc     = 'h2, h3',
    vars    = {},
  } = config;

  // :::::: THEME
  // the page theme is a preset of css/themes.css (or any css color), the code theme
  // one of aufbau-code's. both persist, both lists are loaded behind the first paint

  const pageTheme  = typedSignal({ type: 'string', value: DEFAULT_THEME, key: 'docs-theme-page', storage: 'aufbau' });
  const codeTheme  = typedSignal({ type: 'string', value: DEFAULT_CODE,  key: 'docs-theme-code', storage: 'aufbau' });
  const pageThemes = signal([pageTheme.value]);   // seeded with the active one, so a picker is never empty
  const codeThemes = signal([codeTheme.value]);

  // index.ass links the reset: linked sheets come before adopted ones in the
  // cascade, an adopted reset would undo the typography of css/docs.css
  aufbau.boot({ css: { reset: false, theme: pageTheme.value }, font: ['manrope', 'jetbrains-mono'] });
  initDefaultStylesheet(import.meta.resolve('./index.ass'));
  if (sw) navigator.serviceWorker?.register(sw, { type: 'module' }).catch(console.error);

  effect(() => { aufbau.gestalt.set({ theme: pageTheme.value }); });
  effect(() => { aufbau.elements.setConfig({ code: { theme: codeTheme.value } }); });

  const withActive = (list, active) => list.includes(active) ? list : [active, ...list];
  aufbau.gestalt.themes().then(list => { pageThemes.value = withActive(list, pageTheme.value); });
  AufbauCode.themes().then(list => { codeThemes.value = withActive(list, codeTheme.value); });

  // :::::: STATE

  // the repo root, defaulted from the $repo convention the config already uses.
  // resolved once, every markdown page rebases its assets against it
  const rootURL = new URL(resolvePath(root ?? vars.repo ?? './', vars), document.baseURI).href;
  const items   = normalizeSidebar(sidebar);

  const route  = signal(parseHash(index));
  const brandS = signal({ title: isString(brand) ? brand : (brand?.title || title), img: null, svg: null });
  const page   = signal({ status: 'loading', html: '', before: null, after: null });

  addEventListener('hashchange', () => { route.value = parseHash(index); });

  resolveBrand(brand, title, vars).then(value => { brandS.value = value; });

  // the slots are the same on every page, loaded once
  const slots = Promise.all([resolveExtension(before, vars), resolveExtension(after, vars)]);

  // one load per route. a newer route wins over a slower older one
  let loads = 0;
  effect(() => {
    const { path, anchor } = route.value;
    const load = ++loads;

    page.value = { ...page.peek(), status: 'loading' };

    Promise.all([importMarkdown(resolvePath(path, vars)), slots])
      .then(([[raw, file], [beforeSlot, afterSlot]]) => {
        if (load !== loads) return;

        // where the markdown actually lives, which is not where the page lives
        const docURL = new URL(file, document.baseURI).href;
        page.value = { status: 'ready', html: processContent(raw, { docURL, rootURL }), before: beforeSlot, after: afterSlot };

        requestAnimationFrame(() => {
          if (anchor) document.getElementById(anchor)?.scrollIntoView();
          else document.getElementById('app-body')?.scrollTo(0, 0);
        });
      })
      .catch(error => {
        if (load !== loads) return;
        console.error('[DocsFW]', error);
        page.value = { ...page.peek(), status: 'error', error: `failed to load: ${path}` };
      });
  });

  // translates github compatible hrefs into router hashes at click time, so the
  // markdown source stays readable on github itself
  function onContentClick (event) {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    const href = link.getAttribute('href');
    if (!href || isExternal(href) || link.target === '_blank') return;

    event.preventDefault();
    const { path } = route.value;

    // a plain anchor stays in the current document
    if (href.startsWith('#')) {
      location.hash = `#/${path}#${href.slice(1)}`;
      return;
    }

    const [to, anchor] = href.split('#');
    const next = new URL(to, new URL(path, 'file:///')).pathname.replace(/^\//, '');
    location.hash = `#/${next}${anchor ? `#${anchor}` : ''}`;
  }

  // :::::: COMPONENTS

  function ExtensionSlot ({ slot }) {
    if (slot?.type === 'component') return html`<${slot.value} />`;
    if (slot?.type === 'html')      return html`<div class="docs-extension" dangerouslySetInnerHTML=${{ __html: slot.value }} />`;
    return null;
  }

  // an internal link, owns the hash routing convention
  function RouterLink ({ to, anchor, class: className, children }) {
    const active = route.value.path === to;
    return html`
      <a href=${`#/${to}${anchor ? `#${anchor}` : ''}`} class=${[className, active && 'active'].filter(Boolean).join(' ')}>
        ${children}
      </a>
    `;
  }

  function Header () {
    const { title: brandTitle, img, svg } = brandS.value;
    return html`
      <header id="app-header">
        <${RouterLink} to=${index} class="brand-link">
          <div class="brand">
            ${svg ? html`<span class="brand-svg" dangerouslySetInnerHTML=${{ __html: svg }} />`
            : img ? html`<img class="brand-img" src=${img} alt=${brandTitle} />`
            :       html`<span class="brand-title">${brandTitle}</span>`}
          </div>
        </${RouterLink}>
        <nav class="docs-nav">
          ${items.map(item => html`<${RouterLink} key=${item.path} to=${item.path}>${item.title}</${RouterLink}>`)}
        </nav>
      </header>
    `;
  }

  function MainContent () {
    const { status, html: content, before: beforeSlot, after: afterSlot, error } = page.value;
    if (status === 'error')  return html`<div class="docs-status error">${error}</div>`;
    if (!content)            return html`<div class="docs-status">loading…</div>`;

    return html`
      <div class="docs-body-wrapper" aria-busy=${status === 'loading'}>
        <div class="docs-content-container">
          <${ExtensionSlot} slot=${beforeSlot} />
          <article id="docs-content" class="markdown-body" dangerouslySetInnerHTML=${{ __html: content }} />
          <${ExtensionSlot} slot=${afterSlot} />
        </div>
        ${toc ? html`<aufbau-toc class="docs-toc" target="#docs-content" selector=${toc} />` : null}
      </div>
    `;
  }

  function ThemePicker ({ id, label, options, value }) {
    const onChange = event => { if (event.currentTarget.value) value.value = event.currentTarget.value; };   // effect applies, the store persists
    return html`
      <div class="theme-control">
        <label for=${id}>${label}</label>
        <aufbau-picker id=${id} look="combobox" searchable value=${value.value} onChange=${onChange}>
          ${options.value.map(name => html`<aufbau-option key=${name} value=${name}>${name}</aufbau-option>`)}
        </aufbau-picker>
      </div>
    `;
  }

  function Footer () {
    return html`
      <footer id="app-footer">
        <div class="theme-controls">
          <${ThemePicker} id="page-theme" label="theme"  options=${pageThemes} value=${pageTheme} />
          <${ThemePicker} id="code-theme" label="syntax" options=${codeThemes} value=${codeTheme} />
        </div>
      </footer>
    `;
  }

  const App = () => html`
    <${Header} />
    <div id="app-body" onClick=${onContentClick}>
      <main class="docs-main-content"><${MainContent} /></main>
    </div>
    <${Footer} />
  `;

  const $target = isString(target) ? document.querySelector(target) : target;
  if ($target) render(html`<${App} />`, $target);
}

export { html };
