// @aufbau/builders/docs/index.js

import aufbau, { dom, html, preact } from '@aufbau/kits/preact-htm';
import { isFn, isString, slugify } from '@aufbau/utils';
import { store }   from '@aufbau/store';
import AufbauCode  from '@aufbau/elements/AufbauCode.js'; // imported for its static themes()

const { Fragment } = preact; //TODO: use htm/preact to enable <> syntax
aufbau.init(); //window.html = html;

// :::::: THEMING :::::::::::::::::::::::::::::::::::::::::::::::

// the themes shipped in @aufbau/css/themes, all four loaded by index.aufbau.css
const PAGE_THEMES  = ['classic', 'oled', 'rainbow', 'zombie'];
const DEFAULT_CODE = 'github-dark';

// adapter: bridge @aufbau/store into the betterSignal store interface
// (betterSignal wants get/set; @aufbau/store exposes getSync/setSync).
// @aufbau/store already swallows quota errors and falls back to memory in
// private mode, so there is nothing left to wrap here
const aufbauStore = () => ({
  get: key        => store.getSync(key, undefined),
  set: (key, val) => store.setSync(key, val),
});

const applyCodeTheme = theme => aufbau.elements.setConfig({ code: { theme } });
const applyPageTheme = theme => { if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme; };
//const applyPageTheme = theme => { if (typeof document !== 'undefined') dom.root.dataset.theme = theme; };



/**
 * Resolve brand configuration (supports string, image path, or inline SVG).
 */
async function resolveBrandConfig (brandOption, titleOption, vars = {}) {
  let title = titleOption || 'Documentation';
  let img        = null;
  let svgContent = null;
  let svgPath    = null;

  if (typeof brandOption === 'string') {
    title = brandOption;
  } else if (brandOption && typeof brandOption === 'object') {
    if (brandOption.title) title = brandOption.title;
    if (brandOption.img) img = resolvePath(brandOption.img, vars);
    if (brandOption.svg) svgPath = brandOption.svg;
  }

  // Fetch raw SVG content if path/string is provided
  if (svgPath) {
    const trimmed = svgPath.trim();
    if (trimmed.startsWith('<svg')) {
      svgContent = trimmed;
    } else {
      const resolved = resolvePath(trimmed, vars);
      const importPath = (resolved.startsWith('.') || resolved.startsWith('/') || resolved.startsWith('http'))
        ? resolved
        : `./${resolved}`;

      try {
        const imported = await aufbau.import(importPath);
        svgContent = isString(imported) ? imported : null;
      } catch (err) {
        console.warn(`[DocsFW] Failed to load brand SVG from "${importPath}":`, err);
      }
    }
  }

  return { title, img, svgContent };
}


/**
 * Resolves variables/aliases inside a path string.
 * Supports nested variables (e.g. $comps using $repo).
 * 
 * @param {string} pathStr - Raw path string (e.g. "$comps/readme.md")
 * @param {Object} vars - Variable dictionary (e.g. { repo: '../', comps: '$repo/webcomponents' })
 * @returns {string} Fully resolved file path
 */
export function resolvePath(pathStr, vars = {}) {
  if (!pathStr || typeof pathStr !== 'string') return pathStr;

  let resolved = pathStr;
  let maxPasses = 10; // Prevent infinite loops on circular variables

  while (maxPasses-- > 0) {
    let replaced = false;
    resolved = resolved.replace(/\$(\{([a-zA-Z0-9_]+)\}|([a-zA-Z0-9_]+))/g, (match, _, braced, unbraced) => {
      const varName = braced || unbraced;
      if (Object.prototype.hasOwnProperty.call(vars, varName)) {
        replaced = true;
        return vars[varName];
      }
      return match;
    });

    if (!replaced) break;
  }

  // Clean up duplicate slashes (preserving protocols like http://)
  return resolved.replace(/(?<!:)\/{2,}/g, '/');
}

/**
 * Extract path and heading anchor ID from location hash.
 * Example: "#/$comps/readme.md#installation" -> { path: "$comps/readme.md", anchor: "installation" }
 * 
 * @param {string} [defaultPath='readme.md']
 * @returns {{ path: string, anchor: string|null }}
 */
export function parseHash(defaultPath = 'readme.md') {
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  if (!rawHash) return { path: defaultPath, anchor: null };

  const [path, anchor] = rawHash.split('#');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return {
    path   : cleanPath || defaultPath,
    anchor : anchor    || null
  };
}

/**
 * Normalize sidebar configuration from either Array or Object format.
 */
function normalizeSidebar (sidebar) {
  if (isArray(sidebar)) return sidebar;
  if (sidebar && typeof sidebar === 'object') {
    return Object.entries(sidebar).map(([title, path]) => ({ title, path }));
  }
  return [];
}

/**
 * Resolve content extensions (before / after content injections).
 * Supports: File paths (.html, .md), raw HTML strings, or Preact Component functions.
 */
async function resolveExtension (ext, vars = {}) {
  if (!ext)      return null;
  if (isFn(ext)) return { type: 'component', value: ext };

  if (isString(ext)) {
    const trimmed = ext.trim();
    
    // Inline HTML check
    if (trimmed.startsWith('<') || trimmed.includes('\n')) {
      return { type: 'html', value: trimmed };
    }

    // Resolve path variables and import
    const resolved = resolvePath(trimmed, vars);
    const importPath = (resolved.startsWith('.') || resolved.startsWith('/') || resolved.startsWith('http')) 
      ? resolved 
      : `./${resolved}`;

    try {
      const imported = await aufbau.import(importPath);
      return { type: 'html', value: isString(imported) ? imported : '' };
    } catch (err) {
      console.warn(`[DocsFW] Failed to load extension content from "${importPath}":`, err);
      return null;
    }
  }

  return null;
}

// rewrite fenced code blocks into <aufbau-code>, so highlighting and copy-to-clipboard
// come from the element instead of a docsfw-level hljs pass
function upgradeCodeBlocks (doc) {
  dom.eachElements('pre > code', codeEl => {
    const lang = [...codeEl.classList].find(cls => cls.startsWith('language-'))?.slice(9) || 'plaintext';
    const element = dom.createElement('aufbau-code', { lang, textContent: codeEl.textContent });
    //const element = doc.createElement('aufbau-code'); element.setAttribute('lang', lang); element.textContent = codeEl.textContent;
    codeEl.parentElement.replaceWith(element);
  });
}

export function processContent (htmlContent) {
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html');

  dom.eachElements('h1, h2, h3, h4, h5, h6', (heading, index) => {
    if (!heading.id) heading.id = slugify(heading.textContent || '') || `heading-${index}`;
  });

  upgradeCodeBlocks(doc);

  return doc.body.innerHTML;
}

/**
 * Initializes and mounts the Docs Framework.
 */
 export function createDocsFW (config = {}) {
  const {
    brand      = null,
    title      = 'Documentation',
    index      = 'readme.md',
    sidebar    = [],
    vars       = {},
    target     = '#app',
    footerText = 'Powered by @aufbau/docsfw',
    toc        = 'h2, h3',
    before     = null,
    after      = null
  } = config;

  const normalizedSidebar = normalizeSidebar(sidebar);

  // one reactive node, flat access without .value:
  //   state.mdContent          -> get
  //   state.mdContent = '...'  -> set
  const state = aufbau.signals({
    currentRoute : parseHash(index),
    mdContent    : '',
    tocList      : [],
    isLoading    : true,
    errorMessage : null,
    beforeSlot   : null,
    afterSlot    : null,
  });

  const brandState = aufbau.signal({
    title: isString(brand) ? brand : (brand?.title || title),
    img: null,
    svgContent: null
  });

  // ::: theme signals — self-hydrating and self-persisting via the store adapter.
  // constructing them already restores the stored value (sync store), so no
  // manual read/write/persist plumbing remains
  const pageTheme = aufbau.signal({
    value  : PAGE_THEMES.at(-1),
    values : PAGE_THEMES,               // invalid values are dropped + warned
    key    : 'docs-theme-page',
    store  : aufbauStore,
  });
  const codeTheme = aufbau.signal({
    value : DEFAULT_CODE,
    key   : 'docs-theme-code',
    store : aufbauStore,
  });
  // seeded with the active one so the picker is never momentarily empty
  const codeThemes = aufbau.signal([codeTheme.value]);

  // side-effects betterSignal doesn't own — trigger once with the hydrated value
  applyPageTheme(pageTheme.value);
  applyCodeTheme(codeTheme.value);

  // the full list of every theme in the pinned highlight.js version. falls back
  // to the short list inside <aufbau-code> only when the index is unreachable
  AufbauCode.themes().then(list => {
    codeThemes.value = list.includes(codeTheme.value) ? list : [codeTheme.value, ...list];
  });

  // Hash router event listener
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      state.currentRoute = parseHash(index);
    });
  }

  // Reactive data loader effect
  preact.effect(() => {
    const { path, anchor } = state.currentRoute;

    async function loadDocument() {
      state.isLoading    = true;
      state.errorMessage = null;

      try {
        const resolvedPath = resolvePath(path, vars);
        const importPath = (resolvedPath.startsWith('.') || resolvedPath.startsWith('/') || resolvedPath.startsWith('http'))
          ? resolvedPath
          : `./${resolvedPath}`;

        const [resolvedBrand, rawHtml, resolvedBefore, resolvedAfter] = await Promise.all([
          resolveBrandConfig(brand, title, vars),
          aufbau.import(importPath),
          resolveExtension(before, vars),
          resolveExtension(after, vars)
        ]);

        brandState.value  = resolvedBrand;
        state.mdContent   = processContent(rawHtml);
        state.beforeSlot  = resolvedBefore;
        state.afterSlot   = resolvedAfter;
        state.isLoading   = false;

        requestAnimationFrame(() => {
          anchor ? dom.scrollTo('#'+anchor) : dom.scrollToTop(0);
        });
      } catch (err) {
        console.error('[DocsFW Error]:', err);
        state.errorMessage = `Failed to load document: ${path}`;
        state.isLoading    = false;
      }
    }

    loadDocument();
  });

  // external protocol or protocol-relative url
  const isExternal = (href) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');
  
  // translates github-compatible hrefs into router hashes at click time,
  // so the markdown source stays readable on github itself
  function onContentClick (event) {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

    const href = link.getAttribute('href');
    if (!href || isExternal(href) || link.target === '_blank') return;

    event.preventDefault();
    const { path } = state.currentRoute;

    // plain anchor: stay in the current document
    if (href.startsWith('#')) {
      window.location.hash = `#/${path}#${href.slice(1)}`;
      return;
    }

    // relative document link, resolved against the current doc's directory.
    // deliberately resolved in UNRESOLVED space, with '$repo' still in place:
    // routes stay symbolic and only turn into real paths at load time. resolving
    // first would collapse '../' against the url root and drop the variable.
    const [to, anchor] = href.split('#');
    const next = new URL(to, new URL(path, 'file:///')).pathname.replace(/^\//, '');
    window.location.hash = `#/${next}${anchor ? `#${anchor}` : ''}`;
  }

  // Helper component to render dynamic extensions
  function ExtensionSlot ({ slotData }) {
    switch (slotData?.type) {
      case 'component' : return html`<${slotData.value} />`;
      case 'html'      : return html`<div class="docs-extension" dangerouslySetInnerHTML=${{ __html: slotData.value }} />`;     
      default          : return null;
    }
  }

  // internal link that owns the hash-routing convention
  function RouterLink ({ to, anchor, class: className, children }) {
    const href  = `#/${to}${anchor ? `#${anchor}` : ''}`;
    const active = state.currentRoute.path === to;
  
    return html`
      <a href=${href} class=${[className, active && 'active'].filter(Boolean).join(' ')}>
        ${children}
      </a>
    `;
  }

  // UI Components
  function Header () {
    const activePath = currentRoute.value.path;
    const { title: brandTitle, img: brandImg, svgContent: brandSvg } = brandState.value;

    return html`
      <header id="app-header">
        <${RouterLink} to=${index} class="brand-link">
          <div class="brand">
            ${brandSvg   ? html`<span class="brand-svg" dangerouslySetInnerHTML=${{ __html: brandSvg }} />`
            : brandImg   ? html`<img class="brand-img" src=${brandImg} alt=${brandTitle} />`
            : brandTitle ? html`<span class="brand-title">${brandTitle}</span>` 
            : null}
          </div>
        </${RouterLink}>
        <nav class="docs-nav">
          ${normalizedSidebar.map(item => html`
            <${RouterLink} key=${item.path} to=${item.path}>${item.title}</${RouterLink}>
          `)}
          </nav>
      </header>
    `;
  }


  function TableOfContents() {
    const items = state.tocList;
    const currentPath = state.currentRoute.path;

    if (!items.length) return null;

    return html`
      <aside class="docs-toc">
        <h4>On This Page</h4>
        <nav>
          ${items.map(item => html`
            <a 
              key=${item.id} 
              href="#/${currentPath}#${item.id}"
              class=${`toc-item level-${item.level}`}
            >
              ${item.text}
            </a>
          `)}
        </nav>
      </aside>
    `;
  }

  function MainContent() {
    if (state.isLoading)    return html`<div class="docs-status">Loading documentation...</div>`;
    if (state.errorMessage) return html`<div class="docs-status error">${state.errorMessage}</div>`;

    return html`
      <div class="docs-body-wrapper">
        <div class="docs-content-container">
          <${ExtensionSlot} slotData=${state.beforeSlot} />
          <article id="docs-content" class="markdown-body"
            dangerouslySetInnerHTML=${{ __html: state.mdContent }} />
          <${ExtensionSlot} slotData=${state.afterSlot} />
        </div>
        ${toc ? html`<aufbau-toc class="docs-toc" target="#docs-content" selector=${toc} />` : null}
      </div>
    `;
  }

  function ThemeControls () {
    const choose = (signal, apply) => (event) => {
      const value = event.target.value;
      if (!value || value === signal.value) return;
      signal.value = value;   // persists itself via the store adapter
      apply(value);           // side-effect the signal doesn't own
    };

    const picker = (id, label, options, signal, apply, extra = {}) => html`
      <div class="theme-control">
        <label for=${id}>${label}</label>
        <aufbau-picker
          id=${id}
          look="combobox"
          value=${signal.value}
          onChange=${choose(signal, apply)}
          ...${extra}
        >
          ${options.map(name => html`
            <aufbau-option key=${name} value=${name}>${name}</aufbau-option>
          `)}
        </aufbau-picker>
      </div>
    `;

    return html`
      <div class="theme-controls">
        ${picker('page-theme', 'theme',  PAGE_THEMES,       pageTheme, applyPageTheme, { searchable: true })}
        ${picker('code-theme', 'syntax', codeThemes.value,  codeTheme, applyCodeTheme, { searchable: true })}
      </div>
    `;
  }

  // footerText is still accepted as an option, it is just not rendered any more.
  // the footer carries the theme controls now
  function Footer() {
    return html`
      <footer id="app-footer">
        <${ThemeControls} />
      </footer>
    `;
  }
  
  function App() {
    return html`
      <${Fragment}>
        <${Header} />
        <div id="app-body" onClick=${onContentClick}>
          <main class="docs-main-content">
            <${MainContent} />
          </main>
        </div>
        <${Footer} />
      </${Fragment}>
    `;
  }

  // Mount framework to target node
  const $target = dom.getElement(target);
  //const $target = isString(target) ? document.querySelector(target) : target;
  if ($target) preact.render(html`<${App} />`, $target);
  
}

export { html };
