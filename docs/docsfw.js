import hljs from 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/+esm';
import aufbau, { html, Fragment, effect } from '@aufbau/kit';

/**
 * Extract path and anchor ID from location hash.
 */
export function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { path: 'readme.md', anchor: null };

  const [path, anchor] = hash.split('#');
  return { path: path || 'readme.md', anchor: anchor || null };
}

/**
 * Inject slug IDs into HTML headings and generate Table of Contents items.
 */
export function processHtmlAndBuildToc (htmlContent) {
  const parser   = new DOMParser;
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
    sidebar    = [],
    target     = '#app',
    footerText = 'Powered by @aufbau/docsfw'
  } = config;

  // Signals
  const currentRoute = aufbau.signal(parseHash());
  const mdContent    = aufbau.signal('');
  const tocList      = aufbau.signal([]);
  const isLoading    = aufbau.signal(true);
  const errorMessage = aufbau.signal(null);

  // Hash router event listener
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      currentRoute.value = parseHash();
    });
  }

  // Reactive data loader effect
  effect(() => {
    const { path, anchor } = currentRoute.value;

    async function loadDocument() {
         isLoading.value = true;
      errorMessage.value = null;

      try {
        // Fetch and parse markdown via @aufbau/import
        const rawHtml = await aufbau.import(`./${path}`);
        const { processedHtml, toc } = processHtmlAndBuildToc(rawHtml);

        mdContent.value = processedHtml;
          tocList.value = toc;
        isLoading.value = false;

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
           isLoading.value = false;
      }
    }

    loadDocument();
  });

  // UI Components
  function Header() {
    const activePath = currentRoute.value.path;
    return html`
      <header id="app-header">
        <div class="brand">${title}</div>
        <nav class="docs-nav">
          ${sidebar.map(item => html`
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

  function SidebarNav() {
    

    return html`
      <aside class="docs-sidebar">
        
      </aside>
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
        <article 
          class="markdown-body" 
          dangerouslySetInnerHTML=${{ __html: mdContent.value }} 
        />
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
