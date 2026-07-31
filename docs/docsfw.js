import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';
import aufbau, { html, Fragment, effect } from '@aufbau/kit';

/**
 * Extract path and anchor ID from location hash.
 */
export function parseHash(defaultPath = 'readme.md') {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { path: defaultPath, anchor: null };

  const [path, anchor] = hash.split('#');
  return {
    path   : path   || defaultPath, 
    anchor : anchor || null
  };
}

/**
 * Normalize sidebar configuration from either Array or Object format.
 */
function normalizeSidebar(sidebar) {
  if (Array.isArray(sidebar)) return sidebar;
  if (sidebar && typeof sidebar === 'object') {
    return Object.entries(sidebar).map(([title, path]) => ({ title, path }));
  }
  return [];
}

/**
 * Resolve content extensions (before / after content injections).
 * Supports: File paths (.html, .md), raw HTML strings, or Preact Component functions.
 */
async function resolveExtension(ext) {
  if (!ext) return null;

  // Case A: Preact Component function
  if (typeof ext === 'function') {
    return { type: 'component', value: ext };
  }

  // Case B: String (File path or raw HTML)
  if (typeof ext === 'string') {
    const trimmed = ext.trim();
    
    // Inline HTML check (starts with '<' or contains line breaks)
    if (trimmed.startsWith('<') || trimmed.includes('\n')) {
      return { type: 'html', value: trimmed };
    }

    // Treat as file path to import via @aufbau/import
    try {
      const imported = await aufbau.import(trimmed);
      return { type: 'html', value: typeof imported === 'string' ? imported : '' };
    } catch (err) {
      console.warn(`[DocsFW] Failed to load extension content from "${trimmed}":`, err);
      return null;
    }
  }

  return null;
}

/**
 * Inject slug IDs into HTML headings and generate Table of Contents items.
 */
export function processHtmlAndBuildToc(htmlContent) {
  const parser   = new DOMParser();
  const doc      = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const toc      = [];

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1), 10);
    const text  = heading.textContent || '';
    
    let id = heading.id;
    if (!id) {
      id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-') || `heading-${index}`;
      heading.id = id;
    }

    toc.push({ id, text, level });
  });

  return {
    processedHtml: doc.body.innerHTML,
    toc
  };
}

/**
 * Initializes and mounts the Docs Framework.
 */
export function createDocsFW(config = {}) {
  const {
    title      = 'Documentation',
    index      = 'readme.md',
    sidebar    = [],
    target     = '#app',
    footerText = 'Powered by @aufbau/docsfw',
    before     = null,
    after      = null
  } = config;

  const normalizedSidebar = normalizeSidebar(sidebar);

  // Signals
  const currentRoute = aufbau.signal(parseHash(index));
  const mdContent    = aufbau.signal('');
  const tocList      = aufbau.signal([]);
  const isLoading    = aufbau.signal(true);
  const errorMessage = aufbau.signal(null);

  const beforeSlot   = aufbau.signal(null);
  const afterSlot    = aufbau.signal(null);

  // Hash router event listener
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      currentRoute.value = parseHash(index);
    });
  }

  // Reactive data loader effect
  effect(() => {
    const { path, anchor } = currentRoute.value;

    async function loadDocument() {
      isLoading.value = true;
      errorMessage.value = null;

      try {
        // Fetch document and extensions in parallel
        const [rawHtml, resolvedBefore, resolvedAfter] = await Promise.all([
          aufbau.import(`./${path}`),
          resolveExtension(before),
          resolveExtension(after)
        ]);

        const { processedHtml, toc } = processHtmlAndBuildToc(rawHtml);

        mdContent.value  = processedHtml;
        tocList.value    = toc;
        beforeSlot.value = resolvedBefore;
        afterSlot.value  = resolvedAfter;
        isLoading.value  = false;

        // Post-render DOM manipulation
        requestAnimationFrame(() => {
          document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
          });

          if (anchor) {
            const targetEl = document.getElementById(anchor);
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      } catch (err) {
        console.error('[DocsFW Error]:', err);
        errorMessage.value = `Failed to load document: ${path}`;
        isLoading.value    = false;
      }
    }

    loadDocument();
  });

  // Helper component to render dynamic extensions
  function ExtensionSlot ({ slotData }) {
    switch (slotData?.type) {
      case 'component' : return html`<${slotData.value} />`;
      case 'html'      ; return html`<div class="docs-extension" dangerouslySetInnerHTML=${{ __html: slotData.value }} />`;     
      default          : return null;
    }
  }

  // UI Components
  function Header() {
    const activePath = currentRoute.value.path;
    return html`
      <header id="app-header">
        <a href="#/${index}" class="brand-link">
          <div class="brand">${title}</div>
        </a>
        <nav class="docs-nav">
          ${normalizedSidebar.map(item => html`
            <a 
              key=${item.path} 
              href="#/${item.path}" 
              class=${activePath === item.path ? 'active' : ''}
            >
              ${item.title}
            </a>
          `)}
        </nav>
      </header>
    `;
  }

  function TableOfContents() {
    const items = tocList.value;
    const currentPath = currentRoute.value.path;

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
    if (isLoading.value) {
      return html`<div class="docs-status">Loading documentation...</div>`;
    }

    if (errorMessage.value) {
      return html`<div class="docs-status error">${errorMessage.value}</div>`;
    }

    return html`
      <div class="docs-body-wrapper">
        <div class="docs-content-container">
          <${ExtensionSlot} slotData=${beforeSlot.value} />
          <article 
            class="markdown-body" 
            dangerouslySetInnerHTML=${{ __html: mdContent.value }} 
          />
          <${ExtensionSlot} slotData=${afterSlot.value} />
        </div>
        <${TableOfContents} />
      </div>
    `;
  }

  function Footer() {
    return html`
      <footer id="app-footer">
        <span>${footerText}</span>
      </footer>
    `;
  }

  function App() {
    return html`
      <${Fragment}>
        <${Header} />
        <div id="app-body">
          <main class="docs-main-content">
            <${MainContent} />
          </main>
        </div>
        <${Footer} />
      </${Fragment}>
    `;
  }

  // Mount framework to target node
  const $target = typeof target === 'string' ? document.querySelector(target) : target;
  if ($target) {
    aufbau.render(html`<${App} />`, $target);
  }
}
